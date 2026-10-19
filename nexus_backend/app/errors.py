class ServiceError(Exception):
    """A user-presentable error. `message` is sent to the frontend as {"detail": message}."""

    def __init__(self, message: str, status: int = 502):
        super().__init__(message)
        self.message = message
        self.status = status
