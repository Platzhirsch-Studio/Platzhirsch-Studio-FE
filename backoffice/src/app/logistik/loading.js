import { DataTableSkeleton } from "@/components/Backoffice/DataTable/DataTable";

// Skeleton in Zielhöhe (Q-H/lounge.md §9.8): Raster steht vor dem Inhalt.
export default function LogistikLaden() {
  return (
    <div className="p-6" aria-busy="true">
      <DataTableSkeleton />
    </div>
  );
}
