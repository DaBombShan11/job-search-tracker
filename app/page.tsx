"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Application = {
  id: number;
  user_id: string | null;
  user_name: string | null;
  company: string | null;
  role: string | null;
  location: string | null;
  job_posting: string | null;
  source: string | null;
  referral_contact: string | null;
  compensation: string | null;
  date_applied: string | null;
  status: string | null;
  status_date: string | null;
  next_step: string | null;
  notes: string | null;
  created_at: string;
};

type UserProfile = {
  user_id: string;
  name: string | null;
  reminder_time: string | null;
  profile_color: string | null;
};

type PersonStats = {
  name: string;
  initial: string;
  appliedToday: boolean;
  streak: number;
  applied: number;
  oas: number;
  interviews: number;
  offers: number;
  rejected: number;
};

type PersonCardProps = PersonStats & {
  reminderTime: string;
  profileColor: string;
  canEdit: boolean;
  savingReminder: boolean;
  savingColor: boolean;
  onReminderChange: (time: string) => void;
  onColorChange: (color: string) => void;
};

const colorOptions = [
  { value: "purple", label: "💜 Purple" },
  { value: "green", label: "💚 Green" },
  { value: "pink", label: "🩷 Pink" },
  { value: "blue", label: "💙 Blue" },
  { value: "orange", label: "🧡 Orange" },
  { value: "teal", label: "🩵 Teal" },
  { value: "yellow", label: "💛 Yellow" },
];

const colorStyles: Record<
  string,
  {
    circle: string;
    soft: string;
    border: string;
    text: string;
    badge: string;
    row: string;
  }
> = {
  purple: {
    circle: "bg-purple-200 text-purple-800",
    soft: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-800",
    badge: "bg-purple-100 text-purple-800",
    row: "bg-purple-50/60",
  },

  green: {
    circle: "bg-green-200 text-green-800",
    soft: "bg-green-50",
    border: "border-green-200",
    text: "text-green-800",
    badge: "bg-green-100 text-green-800",
    row: "bg-green-50/60",
  },

  pink: {
    circle: "bg-pink-200 text-pink-800",
    soft: "bg-pink-50",
    border: "border-pink-200",
    text: "text-pink-800",
    badge: "bg-pink-100 text-pink-800",
    row: "bg-pink-50/60",
  },

  blue: {
    circle: "bg-blue-200 text-blue-800",
    soft: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    badge: "bg-blue-100 text-blue-800",
    row: "bg-blue-50/60",
  },

  orange: {
    circle: "bg-orange-200 text-orange-800",
    soft: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-800",
    badge: "bg-orange-100 text-orange-800",
    row: "bg-orange-50/60",
  },

  teal: {
    circle: "bg-teal-200 text-teal-800",
    soft: "bg-teal-50",
    border: "border-teal-200",
    text: "text-teal-800",
    badge: "bg-teal-100 text-teal-800",
    row: "bg-teal-50/60",
  },

  yellow: {
    circle: "bg-yellow-200 text-yellow-800",
    soft: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-800",
    badge: "bg-yellow-100 text-yellow-800",
    row: "bg-yellow-50/60",
  },
};

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getPreviousDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);

  const date = new Date(year, month - 1, day);

  date.setDate(date.getDate() - 1);

  const previousYear = date.getFullYear();
  const previousMonth = String(date.getMonth() + 1).padStart(2, "0");
  const previousDay = String(date.getDate()).padStart(2, "0");

  return `${previousYear}-${previousMonth}-${previousDay}`;
}

function calculateStreak(applications: Application[]) {
  const dates = new Set(
    applications
      .map((application) => application.date_applied)
      .filter((date): date is string => Boolean(date))
  );

  if (dates.size === 0) {
    return 0;
  }

  const today = getTodayDate();
  const yesterday = getPreviousDate(today);

  let currentDate: string;

  if (dates.has(today)) {
    currentDate = today;
  } else if (dates.has(yesterday)) {
    currentDate = yesterday;
  } else {
    return 0;
  }

  let streak = 0;

  while (dates.has(currentDate)) {
    streak += 1;
    currentDate = getPreviousDate(currentDate);
  }

  return streak;
}

function buildPersonStats(
  name: string,
  applications: Application[]
): PersonStats {
  const personApplications = applications.filter(
    (application) =>
      application.user_name?.trim().toLowerCase() ===
      name.toLowerCase()
  );

  const today = getTodayDate();

  const countStatus = (status: string) =>
    personApplications.filter(
      (application) =>
        application.status?.trim().toLowerCase() ===
        status.toLowerCase()
    ).length;

  return {
    name,
    initial: name.charAt(0).toUpperCase(),

    appliedToday: personApplications.some(
      (application) => application.date_applied === today
    ),

    streak: calculateStreak(personApplications),

    applied: personApplications.length,
    oas: countStatus("OA"),
    interviews: countStatus("Interview"),
    offers: countStatus("Offer"),
    rejected: countStatus("Rejected"),
  };
}

function normalizeTime(time: string | null) {
  if (!time) {
    return "18:00";
  }

  return time.slice(0, 5);
}

function formatReminderTime(time: string | null) {
  const normalized = normalizeTime(time);

  const [hourString, minute] = normalized.split(":");

  const hour = Number(hourString);

  const suffix = hour >= 12 ? "PM" : "AM";

  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${suffix}`;
}

function formatDate(date: string | null) {
  if (!date) {
    return "—";
  }

  const [year, month, day] = date.split("-");

  return `${month}/${day}/${year}`;
}

function getDefaultColor(name: string) {
  if (name.trim().toLowerCase() === "michelle") {
    return "green";
  }

  return "purple";
}

function PersonCard({
  name,
  initial,
  appliedToday,
  streak,
  applied,
  oas,
  interviews,
  offers,
  rejected,
  reminderTime,
  profileColor,
  canEdit,
  savingReminder,
  savingColor,
  onReminderChange,
  onColorChange,
}: PersonCardProps) {
  const styles =
    colorStyles[profileColor] ?? colorStyles.purple;

  return (
    <div
      className={`w-full rounded-3xl border bg-white/90 p-6 shadow-sm ${styles.border}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold ${styles.circle}`}
          >
            {initial}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-pink-950">
              {name}
            </h2>

            {appliedToday ? (
              <p className="mt-1 font-medium text-green-600">
                😊 Applied today ✓
              </p>
            ) : (
              <p className="mt-1 font-medium text-amber-600">
                😐 Still needs to apply
              </p>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl">
            {streak > 0 ? "🔥" : "🌱"}
          </p>

          <p className="font-bold text-pink-950">
            {streak} {streak === 1 ? "day" : "days"}
          </p>

          <p className="text-sm text-pink-500">
            Current streak
          </p>
        </div>
      </div>

      <div
        className={`mt-5 rounded-2xl border p-4 ${styles.soft} ${styles.border}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Daily Reminder
            </p>

            <p className={`mt-1 font-bold ${styles.text}`}>
              ⏰ {formatReminderTime(reminderTime)}
            </p>
          </div>

          {canEdit ? (
            <div>
              <input
                type="time"
                value={normalizeTime(reminderTime)}
                disabled={savingReminder}
                onChange={(event) =>
                  onReminderChange(event.target.value)
                }
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
              />

              {savingReminder && (
                <p className="mt-1 text-xs text-gray-400">
                  Saving...
                </p>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400">
              {name}&apos;s setting
            </span>
          )}
        </div>

        {canEdit && (
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-black/5 pt-3">
            <span className="text-xs font-medium text-gray-500">
              Card color
            </span>

            <select
              value={profileColor}
              disabled={savingColor}
              onChange={(event) =>
                onColorChange(event.target.value)
              }
              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm outline-none"
            >
              {colorOptions.map((color) => (
                <option
                  key={color.value}
                  value={color.value}
                >
                  {color.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <hr className="my-6 border-pink-100" />

      <div className="grid grid-cols-5 gap-3 text-center">
        <div>
          <p className="text-xl font-bold text-pink-950">
            {applied}
          </p>
          <p className="text-xs text-pink-500">
            Applied
          </p>
        </div>

        <div>
          <p className="text-xl font-bold text-pink-950">
            {oas}
          </p>
          <p className="text-xs text-pink-500">
            OAs
          </p>
        </div>

        <div>
          <p className="text-xl font-bold text-pink-950">
            {interviews}
          </p>
          <p className="text-xs text-pink-500">
            Interviews
          </p>
        </div>

        <div>
          <p className="text-xl font-bold text-pink-950">
            {offers}
          </p>
          <p className="text-xs text-pink-500">
            Offers
          </p>
        </div>

        <div>
          <p className="text-xl font-bold text-pink-950">
            {rejected}
          </p>
          <p className="text-xs text-pink-500">
            Rejected
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [savingReminder, setSavingReminder] =
    useState(false);

  const [savingColor, setSavingColor] =
    useState(false);

  const [message, setMessage] = useState("");

  const [applications, setApplications] = useState<
    Application[]
  >([]);

  const [profiles, setProfiles] = useState<
    UserProfile[]
  >([]);

  const [recentRoles, setRecentRoles] = useState<
    string[]
  >([]);

  const [currentUserId, setCurrentUserId] =
    useState("");

  const [currentUserName, setCurrentUserName] =
    useState("");

  const [ashantiStats, setAshantiStats] =
    useState<PersonStats>({
      name: "Ashanti",
      initial: "A",
      appliedToday: false,
      streak: 0,
      applied: 0,
      oas: 0,
      interviews: 0,
      offers: 0,
      rejected: 0,
    });

  const [michelleStats, setMichelleStats] =
    useState<PersonStats>({
      name: "Michelle",
      initial: "M",
      appliedToday: false,
      streak: 0,
      applied: 0,
      oas: 0,
      interviews: 0,
      offers: 0,
      rejected: 0,
    });

  const loadApplications = useCallback(async () => {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("date_applied", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Could not load applications:",
        error
      );

      setMessage(
        "Could not load application data."
      );

      return;
    }

    const loadedApplications: Application[] =
      data ?? [];

    setApplications(loadedApplications);

    setAshantiStats(
      buildPersonStats(
        "Ashanti",
        loadedApplications
      )
    );

    setMichelleStats(
      buildPersonStats(
        "Michelle",
        loadedApplications
      )
    );

    const uniqueRoles: string[] = [];

    for (const application of loadedApplications) {
      const role = application.role?.trim();

      if (
        role &&
        !uniqueRoles.some(
          (existingRole) =>
            existingRole.toLowerCase() ===
            role.toLowerCase()
        )
      ) {
        uniqueRoles.push(role);
      }

      if (uniqueRoles.length === 5) {
        break;
      }
    }

    setRecentRoles(uniqueRoles);
  }, []);

  const loadProfiles = useCallback(async () => {
    const { data, error } = await supabase
      .from("user_profiles")
      .select(
        "user_id, name, reminder_time, profile_color"
      );

    if (error) {
      console.error(
        "Could not load profiles:",
        error
      );

      return;
    }

    setProfiles(data ?? []);
  }, []);

  useEffect(() => {
    async function loadPage() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const userName =
        typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name.trim()
          : "";

      setCurrentUserId(user.id);
      setCurrentUserName(userName);

      const {
        data: existingProfile,
        error: profileError,
      } = await supabase
        .from("user_profiles")
        .select(
          "user_id, name, reminder_time, profile_color"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error(
          "Could not check profile:",
          profileError
        );
      }

      if (!existingProfile) {
        const { error: createProfileError } =
          await supabase
            .from("user_profiles")
            .insert({
              user_id: user.id,
              name: userName,
              reminder_time: "18:00:00",
              profile_color:
                getDefaultColor(userName),
            });

        if (createProfileError) {
        console.error(
          "Could not create profile:",
          createProfileError.message,
          createProfileError.code,
          createProfileError.details,
          createProfileError.hint
        );
      }
      }

      await Promise.all([
        loadApplications(),
        loadProfiles(),
      ]);

      setLoading(false);
    }

    loadPage();
  }, [router, loadApplications, loadProfiles]);

  function getProfile(name: string) {
    return profiles.find(
      (profile) =>
        profile.name?.trim().toLowerCase() ===
        name.toLowerCase()
    );
  }

  function getPersonColor(name: string) {
    const profile = getProfile(name);

    return (
      profile?.profile_color ??
      getDefaultColor(name)
    );
  }

  function getReminderTime(name: string) {
    const profile = getProfile(name);

    return profile?.reminder_time ?? "18:00:00";
  }

  async function updateReminder(time: string) {
    if (!currentUserId || !time) {
      return;
    }

    setSavingReminder(true);

    const { error } = await supabase
      .from("user_profiles")
      .update({
        reminder_time: `${time}:00`,
      })
      .eq("user_id", currentUserId);

    if (error) {
      console.error(
        "Could not update reminder:",
        error
      );

      alert(
        `Could not save reminder: ${error.message}`
      );

      setSavingReminder(false);
      return;
    }

    await loadProfiles();

    setSavingReminder(false);
  }

  async function updateProfileColor(
    color: string
  ) {
    if (!currentUserId) {
      return;
    }

    setSavingColor(true);

    const { error } = await supabase
      .from("user_profiles")
      .update({
        profile_color: color,
      })
      .eq("user_id", currentUserId);

    if (error) {
      console.error(
        "Could not update color:",
        error
      );

      alert(
        `Could not save color: ${error.message}`
      );

      setSavingColor(false);
      return;
    }

    await loadProfiles();

    setSavingColor(false);
  }

  async function handleStatusChange(
    application: Application,
    newStatus: string
  ) {
    /*
      An application belongs to the account
      that created it, so only that user can
      update its status.
    */
    if (application.user_id !== currentUserId) {
      return;
    }

    const today = getTodayDate();

    const { error } = await supabase
      .from("applications")
      .update({
        status: newStatus,
        status_date: today,
      })
      .eq("id", application.id);

    if (error) {
      console.error(
        "Could not update status:",
        error
      );

      alert(
        `Could not update status: ${error.message}`
      );

      return;
    }

    await loadApplications();
  }

  async function handleAddApplication(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    const form = new FormData(event.currentTarget);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      router.replace("/login");
      return;
    }

    const userName =
      typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name.trim()
        : "";

    if (!userName) {
      setMessage(
        "Your account does not have a name attached to it."
      );

      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("applications")
      .insert({
        user_id: user.id,
        user_name: userName,

        company:
          form.get("company")?.toString() || "",

        role:
          form.get("role")?.toString() || "",

        location:
          form.get("location")?.toString() || null,

        job_posting:
          form.get("job_posting")?.toString() ||
          null,

        source:
          form.get("source")?.toString() || null,

        referral_contact:
          form
            .get("referral_contact")
            ?.toString() || null,

        compensation:
          form.get("compensation")?.toString() ||
          null,

        date_applied:
          form.get("date_applied")?.toString() ||
          getTodayDate(),

        status:
          form.get("status")?.toString() ||
          "Applied",

        status_date:
          form.get("status_date")?.toString() ||
          null,

        next_step:
          form.get("next_step")?.toString() ||
          null,

        notes:
          form.get("notes")?.toString() || null,
      });

    if (error) {
      console.error(
        "Error adding application:",
        error
      );

      setMessage(error.message);
      setSaving(false);
      return;
    }

    await loadApplications();

    setSaving(false);
    setShowForm(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();

    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-pink-100 via-pink-50 to-rose-100">
        <p className="font-medium text-pink-700">
          Loading your tracker... 🌸
        </p>
      </main>
    );
  }

  const ashantiColor =
    getPersonColor("Ashanti");

  const michelleColor =
    getPersonColor("Michelle");

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-100 via-pink-50 to-rose-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Top */}
        <div className="flex justify-end">
          <button
            onClick={handleLogout}
            className="rounded-xl border border-pink-200 bg-white/70 px-4 py-2 text-sm font-medium text-pink-700 shadow-sm hover:bg-pink-100"
          >
            Log Out
          </button>
        </div>

        {/* Header */}
        <div className="text-center">
          <p className="text-4xl">🌸</p>

          <h1 className="mt-2 text-4xl font-bold text-pink-950">
            Job Search Accountability
          </h1>

          <p className="mt-2 text-pink-700">
            &quot;One application every day.&quot;
          </p>
        </div>

        {/* Add */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => {
              setMessage("");
              setShowForm(true);
            }}
            className="rounded-xl bg-pink-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-pink-700"
          >
            + Add Application
          </button>
        </div>

        {/* Cards */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <PersonCard
            {...ashantiStats}
            reminderTime={getReminderTime(
              "Ashanti"
            )}
            profileColor={ashantiColor}
            canEdit={
              currentUserName
                .toLowerCase()
                .trim() === "ashanti"
            }
            savingReminder={savingReminder}
            savingColor={savingColor}
            onReminderChange={updateReminder}
            onColorChange={updateProfileColor}
          />

          <PersonCard
            {...michelleStats}
            reminderTime={getReminderTime(
              "Michelle"
            )}
            profileColor={michelleColor}
            canEdit={
              currentUserName
                .toLowerCase()
                .trim() === "michelle"
            }
            savingReminder={savingReminder}
            savingColor={savingColor}
            onReminderChange={updateReminder}
            onColorChange={updateProfileColor}
          />
        </div>

        {/* Applications Table */}
        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-pink-950">
              Applications
            </h2>

            <p className="mt-1 text-sm text-pink-600">
              Ashanti is purple. Michelle is green.
              Your selected colors will update this
              table too.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-pink-200 bg-white shadow-sm">
            {applications.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-3xl">🌸</p>

                <p className="mt-2 font-semibold text-pink-950">
                  No applications yet.
                </p>

                <p className="mt-1 text-sm text-pink-500">
                  Add the first one above.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1500px] w-full text-left text-sm">
                  <thead className="bg-pink-100 text-xs uppercase tracking-wide text-pink-700">
                    <tr>
                      <th className="p-4">
                        Applicant
                      </th>

                      <th className="p-4">
                        Company
                      </th>

                      <th className="p-4">
                        Role
                      </th>

                      <th className="p-4">
                        Location
                      </th>

                      <th className="p-4">
                        Job Posting
                      </th>

                      <th className="p-4">
                        Source
                      </th>

                      <th className="p-4">
                        Referral / Contact
                      </th>

                      <th className="p-4">
                        Compensation
                      </th>

                      <th className="p-4">
                        Date Applied
                      </th>

                      <th className="p-4">
                        Status
                      </th>

                      <th className="p-4">
                        Status Date
                      </th>

                      <th className="p-4">
                        Next Step
                      </th>

                      <th className="p-4">
                        Notes
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {applications.map(
                      (application) => {
                        const personColor =
                          getPersonColor(
                            application.user_name ??
                              ""
                          );

                        const styles =
                          colorStyles[
                            personColor
                          ] ??
                          colorStyles.purple;

                        const canEditApplication =
                          application.user_id ===
                          currentUserId;

                        return (
                          <tr
                            key={application.id}
                            className={`border-t border-pink-100 ${styles.row}`}
                          >
                            <td className="p-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}
                              >
                                {application.user_name ??
                                  "Unknown"}
                              </span>
                            </td>

                            <td className="p-4 font-semibold text-gray-900">
                              {application.company ||
                                "—"}
                            </td>

                            <td className="p-4">
                              {application.role ||
                                "—"}
                            </td>

                            <td className="p-4">
                              {application.location ||
                                "—"}
                            </td>

                            <td className="p-4">
                              {application.job_posting ? (
                                <a
                                  href={
                                    application.job_posting
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-medium text-pink-600 hover:underline"
                                >
                                  View Job ↗
                                </a>
                              ) : (
                                "—"
                              )}
                            </td>

                            <td className="p-4">
                              {application.source ||
                                "—"}
                            </td>

                            <td className="p-4">
                              {application.referral_contact ||
                                "—"}
                            </td>

                            <td className="p-4">
                              {application.compensation ||
                                "—"}
                            </td>

                            <td className="p-4">
                              {formatDate(
                                application.date_applied
                              )}
                            </td>

                            <td className="p-4">
                              {canEditApplication ? (
                                <select
                                  value={
                                    application.status ??
                                    "Applied"
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    handleStatusChange(
                                      application,
                                      event.target
                                        .value
                                    )
                                  }
                                  className="rounded-lg border border-pink-200 bg-white px-2 py-2 font-medium outline-none focus:border-pink-500"
                                >
                                  <option value="Applied">
                                    Applied
                                  </option>

                                  <option value="OA">
                                    OA
                                  </option>

                                  <option value="Interview">
                                    Interview
                                  </option>

                                  <option value="Offer">
                                    Offer
                                  </option>

                                  <option value="Rejected">
                                    Rejected
                                  </option>
                                </select>
                              ) : (
                                <span className="font-medium">
                                  {application.status ||
                                    "Applied"}
                                </span>
                              )}
                            </td>

                            <td className="p-4">
                              {formatDate(
                                application.status_date
                              )}
                            </td>

                            <td className="p-4">
                              {application.next_step ||
                                "—"}
                            </td>

                            <td className="max-w-xs p-4">
                              {application.notes ||
                                "—"}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-pink-950/30 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-pink-200 bg-pink-50 p-8 shadow-2xl">

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-pink-950">
                    Add Application 🌸
                  </h2>

                  <p className="mt-1 text-sm text-pink-600">
                    This application will
                    automatically be saved under{" "}
                    <strong>
                      {currentUserName}
                    </strong>
                    .
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowForm(false)
                  }
                  className="text-2xl text-pink-400 hover:text-pink-700"
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={handleAddApplication}
                className="mt-6 space-y-5"
              >
                {/* Company + Role */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-pink-950">
                      Company *
                    </label>

                    <input
                      name="company"
                      type="text"
                      required
                      placeholder="e.g. Salesforce"
                      className="w-full rounded-xl border border-pink-200 bg-white p-3 outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-pink-950">
                      Role *
                    </label>

                    <input
                      name="role"
                      type="text"
                      required
                      list="recent-roles"
                      placeholder="e.g. Software Engineer"
                      autoComplete="off"
                      className="w-full rounded-xl border border-pink-200 bg-white p-3 outline-none focus:border-pink-500"
                    />

                    <datalist id="recent-roles">
                      {recentRoles.map(
                        (role) => (
                          <option
                            key={role}
                            value={role}
                          />
                        )
                      )}
                    </datalist>

                    {recentRoles.length >
                      0 && (
                      <p className="mt-1 text-xs text-pink-500">
                        Start typing to see
                        recent roles.
                      </p>
                    )}
                  </div>
                </div>

                {/* Location + Date */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-pink-950">
                      Location
                    </label>

                    <input
                      name="location"
                      type="text"
                      placeholder="e.g. San Francisco, CA"
                      className="w-full rounded-xl border border-pink-200 bg-white p-3 outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-pink-950">
                      Date Applied *
                    </label>

                    <input
                      name="date_applied"
                      type="date"
                      required
                      defaultValue={getTodayDate()}
                      className="w-full rounded-xl border border-pink-200 bg-white p-3 outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                {/* Posting */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-pink-950">
                    Job Posting
                  </label>

                  <input
                    name="job_posting"
                    type="url"
                    placeholder="https://..."
                    className="w-full rounded-xl border border-pink-200 bg-white p-3 outline-none focus:border-pink-500"
                  />
                </div>

                {/* Source + Referral */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-pink-950">
                      Source
                    </label>

                    <select
                      name="source"
                      defaultValue=""
                      className="w-full rounded-xl border border-pink-200 bg-white p-3 outline-none focus:border-pink-500"
                    >
                      <option value="">
                        Select source
                      </option>

                      <option value="Company Website">
                        Company Website
                      </option>

                      <option value="LinkedIn">
                        LinkedIn
                      </option>

                      <option value="Handshake">
                        Handshake
                      </option>

                      <option value="Referral">
                        Referral
                      </option>

                      <option value="Recruiter">
                        Recruiter
                      </option>

                      <option value="Career Fair/Conference">
                        Career Fair/Conference
                      </option>

                      <option value="University">
                        University
                      </option>

                      <option value="Org">
                        Org
                      </option>

                      <option value="Google Search">
                        Google Search
                      </option>

                      <option value="GitHub">
                        GitHub
                      </option>

                      <option value="Return Offer">
                        Return Offer
                      </option>

                      <option value="Other">
                        Other
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-pink-950">
                      Referral / Contact
                    </label>

                    <input
                      name="referral_contact"
                      type="text"
                      placeholder="Name or contact"
                      className="w-full rounded-xl border border-pink-200 bg-white p-3 outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                {/* Compensation */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-pink-950">
                    Compensation
                  </label>

                  <input
                    name="compensation"
                    type="text"
                    placeholder="e.g. $120k - $150k"
                    className="w-full rounded-xl border border-pink-200 bg-white p-3 outline-none focus:border-pink-500"
                  />
                </div>

                {/* Status */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-pink-950">
                      Status
                    </label>

                    <select
                      name="status"
                      defaultValue="Applied"
                      className="w-full rounded-xl border border-pink-200 bg-white p-3 outline-none focus:border-pink-500"
                    >
                      <option value="Applied">
                        Applied
                      </option>

                      <option value="OA">
                        OA
                      </option>

                      <option value="Interview">
                        Interview
                      </option>

                      <option value="Offer">
                        Offer
                      </option>

                      <option value="Rejected">
                        Rejected
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-pink-950">
                      Status Date
                    </label>

                    <input
                      name="status_date"
                      type="date"
                      className="w-full rounded-xl border border-pink-200 bg-white p-3 outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                {/* Next Step */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-pink-950">
                    Next Step
                  </label>

                  <input
                    name="next_step"
                    type="text"
                    placeholder="e.g. Complete OA by Friday"
                    className="w-full rounded-xl border border-pink-200 bg-white p-3 outline-none focus:border-pink-500"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-pink-950">
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    rows={4}
                    placeholder="Anything else you want to remember..."
                    className="w-full resize-none rounded-xl border border-pink-200 bg-white p-3 outline-none focus:border-pink-500"
                  />
                </div>

                {message && (
                  <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {message}
                  </div>
                )}

                <div className="flex justify-end gap-3 border-t border-pink-200 pt-5">
                  <button
                    type="button"
                    onClick={() =>
                      setShowForm(false)
                    }
                    className="rounded-xl border border-pink-300 bg-white px-5 py-2.5 font-medium text-pink-700 hover:bg-pink-100"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-pink-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-pink-700 disabled:opacity-50"
                  >
                    {saving
                      ? "Adding..."
                      : "Add Application"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}