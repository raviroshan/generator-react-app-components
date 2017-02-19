import Actions from 'constants/Actions';

// Utils
import ApiUtils from 'utils/api/ApiUtils';

/**
 * @param  {string} res
 */
// export function setResponseInReducer(res) {
//     return {
//         type: Actions.SOME_DUMMY_ACTION,
//         payload: {
//             someDummyPayload : res
//         }
//     };
// }

/**
 *
 * @param  {string} params
 */
// export function makeSomeNetworkCall(params) {
//     const requestObject = {};
//
//     return function(dispatch) {
//         ApiUtils.makeAjaxRequest({
//             mockJsonResponse: {
//                 url: 'JSON-Blob-API',
//                 inUse: true
//             },
//             url: 'Actual_API',
//             method: 'GET',
//             requestData: requestObject
//         }, (res) => {
//             if (res) {
//                 // dispatch(setResponseInReducer(res));
//             }
//         });
//     };
// }
