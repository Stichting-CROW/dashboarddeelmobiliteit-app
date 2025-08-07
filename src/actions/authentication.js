import { SET_USER, CLEAR_USER, SET_ACL_IN_REDUX, MARK_FEATURE_AS_SEEN, SET_LATEST_SEEN_VERSION } from './actionTypes.js';

export const setUser = (user) => {
    return {
        type: SET_USER,
        payload: user
    }
}

export const clearUser = () => {
    return {
        type: CLEAR_USER
    }
}

export const setAclInRedux = (acl) => {
    return {
        type: SET_ACL_IN_REDUX,
        payload: acl
    }
}

export const markFeatureAsSeen = (featureId) => {
    return {
        type: MARK_FEATURE_AS_SEEN,
        payload: featureId
    }
}

export const setLatestSeenVersion = (version) => {
    return {
        type: SET_LATEST_SEEN_VERSION,
        payload: version
    }
}
