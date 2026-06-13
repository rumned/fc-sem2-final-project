// Who counts as a "member" of a calendar, for display and counting.
//
// Rules:
//   - The owner counts as a member (they were previously left out of totals).
//   - Admin users are never counted, even when an admin owns the calendar.
//   - The owner and the members array are merged and de-duplicated by id.
//
// Each returned person carries an `isOwner` flag so the UI can label them.
// Admin exclusion only applies when the populated user includes `role`
// (the calendar API now returns it); a bare id string is counted as-is.

const idOf = (person) => {
  if (!person) return null;
  const raw = person._id ?? person.id ?? person;
  return raw ? String(raw) : null;
};

const isAdmin = (person) => person && typeof person === "object" && person.role === "admin";

export const getCountedMembers = (calendar) => {
  if (!calendar) return [];

  const owner = calendar.owner;
  const members = calendar.members || [];

  const result = [];
  const seen = new Set();

  // Owner first, unless they're an admin.
  if (owner && typeof owner === "object" && !isAdmin(owner)) {
    const oid = idOf(owner);
    if (oid) {
      seen.add(oid);
      result.push({ ...owner, isOwner: true });
    }
  } else if (owner) {
    // Owner present but stored as a bare id (not populated) — still count it.
    const oid = idOf(owner);
    if (oid && !isAdmin(owner)) {
      seen.add(oid);
      result.push({ _id: oid, isOwner: true });
    }
  }

  // Then the explicit members, skipping admins and anyone already added.
  members.forEach((m) => {
    if (isAdmin(m)) return;
    const mid = idOf(m);
    if (!mid || seen.has(mid)) return;
    seen.add(mid);
    if (m && typeof m === "object") {
      result.push({ ...m, isOwner: false });
    } else {
      result.push({ _id: mid, isOwner: false });
    }
  });

  return result;
};

export const countMembers = (calendar) => getCountedMembers(calendar).length;
