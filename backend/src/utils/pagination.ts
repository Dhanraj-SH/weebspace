export interface PaginationInput {
    page: number;
    limit: number;
}

export const getSkip = ({ page, limit }: PaginationInput): number => (page - 1) * limit;

export const buildPaginationMeta = ({ page, limit }: PaginationInput, total: number) => ({
    pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
    },
});
