/* Notification.js - UML Class: Notification (Simulated SMS Gateway). */
class Notification {
  constructor(userId, message) {
    this.notificationId = Storage.nextId('N');
    this.userId = userId;
    this.message = message;
    this.sentAt = new Date().toLocaleString();
    this.deliveryStatus = 'Delivered';
  }

  send() {
    Storage.push('sms', {
      notificationId: this.notificationId,
      userId: this.userId,
      message: this.message,
      at: this.sentAt,
      deliveryStatus: this.deliveryStatus
    });
    return this;
  }

  static send(userId, message) {
    return new Notification(userId, message).send();
  }

  static inbox(userId) {
    return Storage.get('sms')
      .filter((m) => m.userId === userId)
      .slice(-8)
      .reverse();
  }
}
