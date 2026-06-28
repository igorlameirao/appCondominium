import 'dart:async';

class LogStorage {
  static final LogStorage _instance = LogStorage._internal();
  LogStorage._internal();
  factory LogStorage() => _instance;

  static const _maximumMessages = 1000;
  final List<LogObject> _messages = [];
  List<LogObject> get messages => _messages;
  List<LogObject> get messagesDesc => _messages.reversed.toList();
  final _messageStreamController = StreamController<LogObject>.broadcast();

  void saveLog(LogObject log) {
    _messages.add(log);
    if (_messages.length > _maximumMessages) {
      _messages.removeAt(0);
    }
    _messageStreamController.sink.add(log);
  }

  StreamSubscription<LogObject> onMessageListChange(
      Function(LogObject) callback) {
    return _messageStreamController.stream.listen((message) {
      callback.call(message);
    });
  }

  void dispose() {
    _messageStreamController.close();
  }
}

class LogObject {
  String message;
  String origin;
  DateTime timestamp;
  LogObject(this.message, this.origin, this.timestamp);
}
