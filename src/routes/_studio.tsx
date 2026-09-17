import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Studio } from "@/components/studio";

export const Route = createFileRoute("/_studio")({
  component: StudioLayout,
});

function StudioLayout() {
  return (
    <>
      <Studio />
      <Outlet />
    </>
  );
}
