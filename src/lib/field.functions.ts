import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  distanceMeters,
  localDateString,
  localMinutes,
  parseClock,
} from "@/lib/field-time";

export type Role = "admin" | "supervisor" | "student";

const uuid = z.string().uuid();

/* ------------------------------------------------------------------ */
/* Session: role resolution + account bootstrap                        */
/* ------------------------------------------------------------------ */

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const email = (claims.email as string | undefined) ?? "";

    let { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (!roles || roles.length === 0) {
      await bootstrapAccount(userId, email);
      const again = await supabase.from("user_roles").select("role").eq("user_id", userId);
      roles = again.data ?? [];
    }

    const roleList = (roles ?? []).map((r) => r.role as Role);
    const role: Role = roleList.includes("admin")
      ? "admin"
      : roleList.includes("supervisor")
        ? "supervisor"
        : "student";

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .eq("id", userId)
      .maybeSingle();

    const { data: student } = await supabase
      .from("students")
      .select(
        "id, student_no, full_name, email, phone, program, university, start_date, end_date, organization_id, supervisor_id, organizations(organization_name, address, department, contact, latitude, longitude, radius_meters), supervisors(full_name, email, phone)",
      )
      .eq("user_id", userId)
      .maybeSingle();

    const { data: supervisor } = await supabase
      .from("supervisors")
      .select("id, full_name, email, phone, organization_id, organizations(organization_name)")
      .eq("user_id", userId)
      .maybeSingle();

    return { userId, email, role, profile, student, supervisor };
  });

/**
 * Links a fresh sign-up to its seeded student/supervisor record by email,
 * makes the very first account an administrator, and otherwise creates a
 * pending student record for an administrator to place.
 */
async function bootstrapAccount(userId: string, email: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const normalized = email.trim().toLowerCase();

  const { data: supervisorRow } = await supabaseAdmin
    .from("supervisors")
    .select("id")
    .ilike("email", normalized)
    .is("user_id", null)
    .maybeSingle();

  if (supervisorRow) {
    await supabaseAdmin.from("supervisors").update({ user_id: userId }).eq("id", supervisorRow.id);
    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "supervisor" });
    return;
  }

  const { data: studentRow } = await supabaseAdmin
    .from("students")
    .select("id")
    .ilike("email", normalized)
    .is("user_id", null)
    .maybeSingle();

  if (studentRow) {
    await supabaseAdmin.from("students").update({ user_id: userId }).eq("id", studentRow.id);
    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "student" });
    return;
  }

  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  if (!count) {
    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "admin" });
    return;
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name, phone")
    .eq("id", userId)
    .maybeSingle();

  await supabaseAdmin.from("students").insert({
    user_id: userId,
    student_no: `PENDING/${userId.slice(0, 8).toUpperCase()}`,
    full_name: profile?.full_name || normalized,
    email: normalized,
    phone: profile?.phone ?? null,
    university: "University of Dodoma",
  });
  await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "student" });
}

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        full_name: z.string().trim().min(2).max(120),
        phone: z.string().trim().max(30).optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const phone = data.phone ? data.phone : null;
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: data.full_name, phone })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    await supabase
      .from("students")
      .update({ full_name: data.full_name, phone })
      .eq("user_id", userId);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export const getSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("system_settings")
      .select("*")
      .eq("id", true)
      .single();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        work_start: z.string().regex(/^\d{2}:\d{2}$/),
        work_end: z.string().regex(/^\d{2}:\d{2}$/),
        grace_minutes: z.number().int().min(0).max(120),
        gps_required: z.boolean(),
        default_radius_meters: z.number().int().min(20).max(5000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("system_settings")
      .update(data)
      .eq("id", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Student: dashboard, sign in / out, history, activities              */
/* ------------------------------------------------------------------ */

async function requireStudent(
  supabase: { from: (t: "students") => any },
  userId: string,
) {
  const { data } = await supabase
    .from("students")
    .select(
      "id, student_no, full_name, start_date, end_date, organization_id, organizations(organization_name, latitude, longitude, radius_meters)",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) throw new Error("No field student record is linked to this account yet.");
  return data as {
    id: string;
    student_no: string;
    full_name: string;
    start_date: string | null;
    end_date: string | null;
    organization_id: string | null;
    organizations: {
      organization_name: string;
      latitude: number | null;
      longitude: number | null;
      radius_meters: number;
    } | null;
  };
}

export const getStudentDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const student = await requireStudent(supabase, userId);
    const today = localDateString();

    const [{ data: todayRow }, { data: rows }, { data: settings }, { data: activities }] =
      await Promise.all([
        supabase
          .from("attendance")
          .select("*")
          .eq("student_id", student.id)
          .eq("date", today)
          .maybeSingle(),
        supabase
          .from("attendance")
          .select("*")
          .eq("student_id", student.id)
          .order("date", { ascending: false })
          .limit(120),
        supabase.from("system_settings").select("*").eq("id", true).single(),
        supabase
          .from("daily_activities")
          .select("id, date, activity, approval_status")
          .eq("student_id", student.id)
          .order("date", { ascending: false })
          .limit(30),
      ]);

    const all = rows ?? [];
    const present = all.filter((r) => r.status === "present").length;
    const late = all.filter((r) => r.status === "late").length;
    const absent = all.filter((r) => r.status === "absent").length;
    const attended = present + late;
    const worked = all.filter((r) => r.sign_in_time && r.sign_out_time);
    const avgMinutes = worked.length
      ? Math.round(
          worked.reduce(
            (sum, r) =>
              sum +
              (new Date(r.sign_out_time!).getTime() - new Date(r.sign_in_time!).getTime()) / 60000,
            0,
          ) / worked.length,
        )
      : 0;

    const totalDays =
      student.start_date && student.end_date
        ? Math.max(
            1,
            Math.round(
              (new Date(student.end_date).getTime() - new Date(student.start_date).getTime()) /
                86400000,
            ),
          )
        : 0;
    const daysRemaining = student.end_date
      ? Math.max(
          0,
          Math.round((new Date(student.end_date).getTime() - Date.now()) / 86400000),
        )
      : 0;

    // Last 7 attendance days, oldest first, for the mini bar chart.
    const weekly = [...all]
      .slice(0, 7)
      .reverse()
      .map((r) => ({
        date: r.date,
        minutes:
          r.sign_in_time && r.sign_out_time
            ? Math.round(
                (new Date(r.sign_out_time).getTime() - new Date(r.sign_in_time).getTime()) / 60000,
              )
            : 0,
        status: r.status,
      }));

    return {
      student,
      today: todayRow ?? null,
      settings,
      recent: all.slice(0, 5),
      weekly,
      stats: {
        attended,
        present,
        late,
        absent,
        avgMinutes,
        totalDays,
        daysRemaining,
        onTimeRate: attended ? Math.round((present / attended) * 100) : 0,
        activitiesFiled: activities?.length ?? 0,
        activitiesPending: (activities ?? []).filter((a) => a.approval_status === "pending").length,
      },
    };
  });

const geoInput = z
  .object({
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
  })
  .default({});

function clientIp(): string | null {
  const request = getRequest();
  const header =
    request?.headers.get("cf-connecting-ip") ??
    request?.headers.get("x-forwarded-for") ??
    null;
  return header ? (header.split(",")[0] ?? "").trim() || null : null;
}

export const signInAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => geoInput.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const student = await requireStudent(supabase, userId);
    const today = localDateString();

    const { data: existing } = await supabase
      .from("attendance")
      .select("id, sign_in_time")
      .eq("student_id", student.id)
      .eq("date", today)
      .maybeSingle();
    if (existing?.sign_in_time) {
      throw new Error("You have already signed in for today.");
    }

    const { data: settings } = await supabase
      .from("system_settings")
      .select("*")
      .eq("id", true)
      .single();

    const org = student.organizations;
    let distance: number | null = null;

    if (settings?.gps_required) {
      if (data.latitude == null || data.longitude == null) {
        throw new Error(
          "Location is required to sign in. Allow location access and try again.",
        );
      }
      if (org?.latitude == null || org?.longitude == null) {
        throw new Error(
          "Your organization has no verified location yet. Ask the administrator to set it.",
        );
      }
      distance = distanceMeters(data.latitude, data.longitude, org.latitude, org.longitude);
      const radius = org.radius_meters ?? settings.default_radius_meters;
      if (distance > radius) {
        throw new Error(
          `You are ${distance} m from ${org.organization_name}. Sign in is only allowed within ${radius} m.`,
        );
      }
    } else if (data.latitude != null && data.longitude != null && org?.latitude != null && org?.longitude != null) {
      distance = distanceMeters(data.latitude, data.longitude, org.latitude, org.longitude);
    }

    const minutes = localMinutes();
    const start = parseClock(settings?.work_start ?? "08:00");
    const grace = settings?.grace_minutes ?? 15;
    const status = minutes > start + grace ? "late" : "present";

    const { error } = await supabase.from("attendance").insert({
      student_id: student.id,
      date: today,
      sign_in_time: new Date().toISOString(),
      status,
      ip_address: clientIp(),
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      distance_meters: distance,
    });
    if (error) throw new Error(error.message);
    return { status, distance };
  });

export const signOutAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => geoInput.parse(input ?? {}))
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const student = await requireStudent(supabase, userId);
    const today = localDateString();

    const { data: row } = await supabase
      .from("attendance")
      .select("id, sign_in_time, sign_out_time")
      .eq("student_id", student.id)
      .eq("date", today)
      .maybeSingle();

    if (!row?.sign_in_time) throw new Error("You cannot sign out before signing in.");
    if (row.sign_out_time) throw new Error("You have already signed out for today.");

    const { error } = await supabase
      .from("attendance")
      .update({ sign_out_time: new Date().toISOString() })
      .eq("id", row.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyAttendance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const student = await requireStudent(supabase, userId);
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("student_id", student.id)
      .order("date", { ascending: false });
    if (error) throw new Error(error.message);
    return { student, rows: data ?? [] };
  });

export const listMyActivities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const student = await requireStudent(supabase, userId);
    const { data, error } = await supabase
      .from("daily_activities")
      .select("*")
      .eq("student_id", student.id)
      .order("date", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const submitActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        activity: z.string().trim().min(5).max(300),
        description: z.string().trim().max(2000).optional().or(z.literal("")),
        skills_learned: z.string().trim().max(1000).optional().or(z.literal("")),
        challenges: z.string().trim().max(1000).optional().or(z.literal("")),
        solutions: z.string().trim().max(1000).optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const student = await requireStudent(supabase, userId);
    const { error } = await supabase.from("daily_activities").insert({
      student_id: student.id,
      date: data.date,
      activity: data.activity,
      description: data.description || null,
      skills_learned: data.skills_learned || null,
      challenges: data.challenges || null,
      solutions: data.solutions || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Supervisor + admin monitoring                                       */
/* ------------------------------------------------------------------ */

export const getMonitorOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const today = localDateString();

    // RLS scopes these reads: supervisors see their own students, admins see all.
    const [{ data: students }, { data: todayRows }, { data: orgs }, { data: activities }] =
      await Promise.all([
        supabase
          .from("students")
          .select(
            "id, student_no, full_name, email, phone, program, start_date, end_date, organizations(organization_name), supervisors(full_name)",
          )
          .order("full_name"),
        supabase.from("attendance").select("*").eq("date", today),
        supabase.from("organizations").select("id, organization_name"),
        supabase
          .from("daily_activities")
          .select("id, date, activity, approval_status, student_id, skills_learned, challenges, solutions, description, supervisor_comment")
          .order("date", { ascending: false })
          .limit(60),
      ]);

    const roster = (students ?? []).map((s) => {
      const row = (todayRows ?? []).find((a) => a.student_id === s.id) ?? null;
      return { ...s, today: row };
    });

    const signedIn = roster.filter((r) => r.today?.sign_in_time).length;
    const signedOut = roster.filter((r) => r.today?.sign_out_time).length;
    const late = roster.filter((r) => r.today?.status === "late").length;

    return {
      date: today,
      roster,
      organizations: orgs ?? [],
      activities: (activities ?? []).map((a) => ({
        ...a,
        student: roster.find((r) => r.id === a.student_id) ?? null,
      })),
      stats: {
        total: roster.length,
        signedIn,
        signedOut,
        late,
        notReported: roster.length - signedIn,
        organizations: (orgs ?? []).length,
        pendingActivities: (activities ?? []).filter((a) => a.approval_status === "pending").length,
      },
    };
  });

export const listAllAttendance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("attendance")
      .select("*, students(id, student_no, full_name, organizations(organization_name))")
      .order("date", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const reviewActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: uuid,
        approval_status: z.enum(["approved", "rejected", "pending"]),
        supervisor_comment: z.string().trim().max(1000).optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("daily_activities")
      .update({
        approval_status: data.approval_status,
        supervisor_comment: data.supervisor_comment || null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Admin management                                                    */
/* ------------------------------------------------------------------ */

export const getAdminData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [{ data: orgs }, { data: supervisors }, { data: students }] = await Promise.all([
      supabase.from("organizations").select("*").order("organization_name"),
      supabase
        .from("supervisors")
        .select("*, organizations(organization_name)")
        .order("full_name"),
      supabase
        .from("students")
        .select("*, organizations(organization_name), supervisors(full_name)")
        .order("full_name"),
    ]);
    return {
      organizations: orgs ?? [],
      supervisors: supervisors ?? [],
      students: students ?? [],
    };
  });

const orgInput = z.object({
  id: uuid.optional(),
  organization_name: z.string().trim().min(2).max(160),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  department: z.string().trim().max(120).optional().or(z.literal("")),
  contact: z.string().trim().max(60).optional().or(z.literal("")),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  radius_meters: z.number().int().min(20).max(5000),
});

export const saveOrganization = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => orgInput.parse(input))
  .handler(async ({ data, context }) => {
    const { id, ...values } = data;
    const payload = {
      ...values,
      address: values.address || null,
      department: values.department || null,
      contact: values.contact || null,
    };
    const query = id
      ? context.supabase.from("organizations").update(payload).eq("id", id)
      : context.supabase.from("organizations").insert(payload);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteOrganization = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: uuid }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("organizations")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const supervisorInput = z.object({
  id: uuid.optional(),
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  organization_id: uuid.nullable(),
});

export const saveSupervisor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => supervisorInput.parse(input))
  .handler(async ({ data, context }) => {
    const { id, ...values } = data;
    const payload = {
      ...values,
      email: values.email.toLowerCase(),
      phone: values.phone || null,
    };
    const query = id
      ? context.supabase.from("supervisors").update(payload).eq("id", id)
      : context.supabase.from("supervisors").insert(payload);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSupervisor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: uuid }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("supervisors").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const studentInput = z.object({
  id: uuid.optional(),
  student_no: z.string().trim().min(3).max(60),
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  program: z.string().trim().max(160).optional().or(z.literal("")),
  university: z.string().trim().max(160).optional().or(z.literal("")),
  organization_id: uuid.nullable(),
  supervisor_id: uuid.nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

export const saveStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => studentInput.parse(input))
  .handler(async ({ data, context }) => {
    const { id, ...values } = data;
    const payload = {
      ...values,
      email: values.email.toLowerCase(),
      phone: values.phone || null,
      program: values.program || null,
      university: values.university || null,
    };
    const query = id
      ? context.supabase.from("students").update(payload).eq("id", id)
      : context.supabase.from("students").insert(payload);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: uuid }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("students").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
