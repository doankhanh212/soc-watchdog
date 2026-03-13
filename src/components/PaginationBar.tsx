import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function PaginationBar(props: {
  page: number; // 1-based
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const { page, totalPages, onPageChange, className } = props;
  if (totalPages <= 1) return null;

  const go = (p: number) => onPageChange(clamp(p, 1, totalPages));

  const pages: Array<number | "ellipsis"> = [];
  const add = (p: number | "ellipsis") => pages.push(p);

  if (totalPages <= 7) {
    for (let p = 1; p <= totalPages; p++) add(p);
  } else {
    add(1);
    if (page > 3) add("ellipsis");
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) add(p);
    if (page < totalPages - 2) add("ellipsis");
    add(totalPages);
  }

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink
            href="#"
            size="default"
            onClick={(e) => {
              e.preventDefault();
              go(page - 1);
            }}
          >
            Trước
          </PaginationLink>
        </PaginationItem>

        {pages.map((p, idx) =>
          p === "ellipsis" ? (
            <PaginationItem key={`e-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                href="#"
                isActive={p === page}
                onClick={(e) => {
                  e.preventDefault();
                  go(p);
                }}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationLink
            href="#"
            size="default"
            onClick={(e) => {
              e.preventDefault();
              go(page + 1);
            }}
          >
            Sau
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
