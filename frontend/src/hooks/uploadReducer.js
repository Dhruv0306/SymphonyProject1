// Upload state actions
export const UPLOAD_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_FILES: 'SET_FILES',
  SET_UPLOAD_STATUS: 'SET_UPLOAD_STATUS',
  SET_RESULTS: 'SET_RESULTS',
  SET_ERROR: 'SET_ERROR',
  RESET_STATE: 'RESET_STATE',
  UPDATE_PROGRESS: 'UPDATE_PROGRESS'
};

// Initial upload state
export const initialUploadState = {
  loading: false,
  files: [],
  uploadStatuses: {},
  results: [],
  error: null,
  progress: null
};

// Upload state reducer for complex state management
export const uploadReducer = (state, action) => {
  switch (action.type) {
    case UPLOAD_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
      
    case UPLOAD_ACTIONS.SET_FILES:
      return { ...state, files: action.payload };
      
    case UPLOAD_ACTIONS.SET_UPLOAD_STATUS:
      return {
        ...state,
        uploadStatuses: {
          ...state.uploadStatuses,
          [action.payload.key]: action.payload.status
        }
      };
      
    case UPLOAD_ACTIONS.SET_RESULTS:
      return { ...state, results: action.payload };
      
    case UPLOAD_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
      
    case UPLOAD_ACTIONS.UPDATE_PROGRESS:
      return { ...state, progress: action.payload };
      
    case UPLOAD_ACTIONS.RESET_STATE:
      return { ...initialUploadState };
      
    default:
      return state;
  }
};