import { FilesCollection } from 'meteor/ostrio:files';
import { tsxInfo, tsxLog, tsxErr, tsxWarn, tsxDebug, logFileForClient, AppLogsDB } from './theLoggers.js';

export function sessionDate( today ) {
  // desired format:
  // 2018-01-01

  var HH = today.getHours();
  var MM = today.getMinutes();
  var SS = today.getSeconds();
  var mm = today.getMonth()+1; // month is zero based
  var dd = today.getDate();
  var yyyy = today.getFullYear();

  // set to the date of the "night" session
  ((HH < 8) ? dd=dd-1 : dd=dd);

  return yyyy +'_'+ ('0'  + mm).slice(-2) +'_'+ ('0'  + dd).slice(-2);
}

export function formatDate( today ) {
  // desired format:
  // 2018-01-01 hh:mm:ss

  var HH = today.getHours();
  var MM = today.getMinutes();
  var SS = today.getSeconds();
  var mm = today.getMonth()+1; // month is zero based
  var dd = today.getDate();
  var yyyy = today.getFullYear();

  return yyyy +'-'+ ('0'  + mm).slice(-2) +'-'+ ('0'  + dd).slice(-2);
  // + ',  '
  // + ('0'  + HH).slice(-2) + ':'
  // + ('0'  + MM).slice(-2) + ':'
  // + ('0'  + SS).slice(-2);
}

export function formatDateTime( today ) {
  // desired format:
  // 2018-01-01 hh:mm:ss

  var HH = today.getHours();
  var MM = today.getMinutes();
  var SS = today.getSeconds();
  var mm = today.getMonth()+1; // month is zero based
  var dd = today.getDate();
  var yyyy = today.getFullYear();

  var ds = yyyy +'-'+ ('0'  + mm).slice(-2) +'-'+ ('0'  + dd).slice(-2)
  + ',  '
  + ('0'  + HH).slice(-2) + ':'
  + ('0'  + MM).slice(-2) + ':'
  + ('0'  + SS).slice(-2);

  return ds;
}
