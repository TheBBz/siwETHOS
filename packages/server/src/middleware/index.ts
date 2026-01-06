/**
 * Middleware Module Index
 */

export {
    ethosAuthMiddleware,
    requireEthosUser,
    requireMinScore,
    getEthosUser,
    extractBearerToken as extractBearerTokenExpress,
    extractTokenFromCookie as extractTokenFromCookieExpress,
    extractTokenFromQuery,
} from './express';

export {
    withEthosAuth,
    withOptionalEthosAuth,
    requireScore,
    extractBearerToken as extractBearerTokenNext,
    extractTokenFromCookie as extractTokenFromCookieNext,
} from './nextjs';

export type {
    NextAPIHandler,
    AuthenticatedHandler,
    NextEthosConfig,
} from './nextjs';
