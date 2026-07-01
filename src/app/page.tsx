import { getSessionUser } from "@/lib/auth/session";
import { getBulletinForEdit } from "@/actions/bulletin-edit";
import FormWizard from "@/components/bulletin/FormWizard";
import type { BulletinData } from "@/lib/bulletin/types";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await getSessionUser();
  const params = await searchParams;
  const editBulletinId = params.edit?.trim() || undefined;

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
    <FormWizard
      key={editBulletinId ?? "new"}
      username={user?.username ?? "User"}
      editBulletinId={editBulletinId}
      initialBulletin={initialBulletin}
      loadError={loadError}
    />
  );
}
