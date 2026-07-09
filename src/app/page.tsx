import { getSessionUser } from "@/lib/auth/session";
import { getUserFullName } from "@/lib/auth/users";
import { getBulletinForEdit } from "@/actions/bulletin-edit";
import SingleScreenForm from "@/components/bulletin/single-screen/SingleScreenForm";
import type { BulletinData } from "@/lib/bulletin/types";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await getSessionUser();
  const params = await searchParams;
  const editBulletinId = params.edit?.trim() || undefined;

  const fullNameFromDb = user ? await getUserFullName(user.userId) : null;
  const fullName =
    fullNameFromDb ||
    user?.fullName?.trim() ||
    user?.username ||
    "User";

  let initialBulletin: BulletinData | undefined;
  let loadError: string | undefined;

  if (editBulletinId) {
    const result = await getBulletinForEdit(editBulletinId);
    if (result.success) {
      initialBulletin = result.data;
    } else {
      loadError = result.error;
    }
  }

  return (
    <SingleScreenForm
      key={editBulletinId ?? "new"}
      username={user?.username ?? "User"}
      fullName={fullName}
      editBulletinId={editBulletinId}
      initialBulletin={initialBulletin}
      loadError={loadError}
    />
  );
}
