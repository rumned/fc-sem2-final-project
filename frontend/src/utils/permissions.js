// Helpers for reasoning about who owns / created an event on the client side.
//
// The backend is the source of truth for edit/delete permissions (creator,
// calendar owner, or admin). The client can't always know the calendar owner,
// so these helpers are used only to (a) show an informative note when an event
// was not created by the logged-in user, and (b) phrase friendly feedback when
// the server rejects a modify/delete attempt.

// Pull a comparable id out of a populated or raw `createdBy` field.
const creatorId = (event) =>
  event?.createdBy?._id ?? event?.createdBy?.id ?? event?.createdBy ?? null;

// True when the logged-in user is the one who created the event.
export const isEventCreator = (event, user) => {
  const id = creatorId(event);
  return id != null && user?.id != null && String(id) === String(user.id);
};

// A human-readable name for whoever created the event.
export const eventCreatorName = (event) =>
  event?.createdBy?.name || event?.createdBy?.email || "another user";

// Short note explaining where a non-owned event comes from, or "" when the
// current user created it (in which case no note is needed). Admins can manage
// everything, so they don't see the note either.
export const eventOwnershipNote = (event, user) => {
  if (!event || !user) return "";
  if (user.role === "admin") return "";
  if (isEventCreator(event, user)) return "";

  const creator = eventCreatorName(event);
  const calName = event?.calendar?.name;

  if (calName) {
    return `Part of “${calName}” · created by ${creator}. Only its creator or the calendar owner can edit or delete it.`;
  }
  return `Created by ${creator}. Only its creator can edit or delete it.`;
};

// Friendly feedback to show when the server rejects a modify/delete attempt.
// The backend is the source of truth: it answers 403 "Not authorized…" when the
// user is neither the creator, the calendar owner, nor an admin. For that case
// we explain who *can* act instead of leaving the user staring at an event that
// won't budge. Any other failure (network, validation) shows the raw message.
// `action` is the verb shown to the user, e.g. "edit" or "delete".
export const permissionErrorMessage = (error, action = "edit") => {
  const raw = typeof error === "string" ? error : error?.message || "";
  if (/not authorized/i.test(raw)) {
    return `You can only ${action} events you created. Only this event’s creator, the calendar owner, or an admin can ${action} it.`;
  }
  return raw || `Couldn’t ${action} the event.`;
};
