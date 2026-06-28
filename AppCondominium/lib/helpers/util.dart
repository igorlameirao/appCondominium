import 'dart:developer' as developer;
import '../services/log_storage.dart';

class Util {
  static String convertToMacAddress(String text) {
    final regex = RegExp(r'^([0-9A-Fa-f]{2}[ :-]){5}[0-9A-Fa-f]{2}$');
    if (regex.hasMatch(text)) {
      return text.toUpperCase();
    } else {
      final mac = text.padLeft(12, '0');
      final formattedMac = mac.replaceAllMapped(
        RegExp(r'.{2}'),
        (match) => '${match.group(0)}:',
      );
      return formattedMac.substring(0, formattedMac.length - 1).toUpperCase();
    }
  }
}

void devLog(String msg, {String origin = ''}) {
  extractCaller(String trace) {
    final regex = RegExp(r'#1[\s\w]+');
    var match = regex.firstMatch(trace)?.group(0);
    match = match?.trim();
    final startPos = (match?.lastIndexOf(' ') ?? 0) + 1;
    var endPos = match?.lastIndexOf('.');
    if (endPos == -1) endPos = match?.length;
    final className = match?.substring(startPos, endPos);
    return className;
  }

  final caller = extractCaller(StackTrace.current.toString());
  final logDate = DateTime.now();
  var logMessage = "[${logDate.millisecondsSinceEpoch}] $msg";

/*
\x1B[30m: Black
\x1B[31m: Red
\x1B[32m: Green
\x1B[33m: Yellow
\x1B[34m: Blue
\x1B[35m: Magenta
\x1B[36m: Cyan
\x1B[37m: White
 */

  if (logMessage.toLowerCase().indexOf('barrier') != -1) {
    logMessage = '\x1B[36m$logMessage\x1B[0m'; //prints in cyan
  } else if (logMessage.toLowerCase().indexOf('disconnected') != -1) {
    logMessage = '\x1B[31m$logMessage\x1B[0m'; //prints in red
  } else if (logMessage.toLowerCase().indexOf('connected') != -1) {
    logMessage = '\x1B[32m$logMessage\x1B[0m'; //prints in green
  } else if (logMessage.toLowerCase().indexOf('exception') != -1) {
    logMessage = '\x1B[31m$logMessage\x1B[0m'; //prints in red
  }

  developer.log(
    logMessage,
    name: caller ?? "",
    time: DateTime.now(),
  );

  final logObject = LogObject(msg, origin, logDate);

  LogStorage().saveLog(logObject);
}
