from sqlalchemy.orm import Session
from models.log import Log


def write_log(db: Session, level: str, message: str):

    log = Log(level=level, message=message)

    db.add(log)
    db.commit()
