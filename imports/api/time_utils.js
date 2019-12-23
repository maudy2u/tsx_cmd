import { FilesCollection } from 'meteor/ostrio:files';
import { tsxInfo, tsxLog, tsxErr, tsxWarn, tsxDebug, logFileForClient, AppLogsDB } from './theLoggers.js';


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
