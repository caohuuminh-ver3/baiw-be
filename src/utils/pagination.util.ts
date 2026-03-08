export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
}

export const getPagination = (query: any, defaultLimit = 50): PaginationParams => {
    const page = Math.abs(parseInt(query.page as string)) || 1;
    const limit = Math.abs(parseInt(query.limit as string)) || defaultLimit;
    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip,
    };
};

export const getPaginationMetadata = (total: number, page: number, limit: number) => {
    return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        currentPage: page,
    };
};
