import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "./pagination";
import { generatePaginationLinks } from "./generate-pages";

type PaginatorProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (pageNumber: number) => void;
  showPreviousNext: boolean;
}

export default function Paginator({
  currentPage,
  totalPages,
  onPageChange,
  showPreviousNext,
}: PaginatorProps) {

  return (
    <Pagination>
      <PaginationContent>
        {showPreviousNext && totalPages ? (
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage - 1 < 1}
            />
          </PaginationItem>
        ) : null}
        {generatePaginationLinks(currentPage, totalPages, onPageChange)}
        {showPreviousNext && totalPages ? (
          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage > totalPages - 1}
            />
          </PaginationItem>
        ): null}
      </PaginationContent>
    </Pagination>
  )
}
