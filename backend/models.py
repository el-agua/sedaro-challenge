from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()   

universe_objects = db.Table('universe_objects',
    db.Column('universe_id', db.Integer, db.ForeignKey('universe.id'), primary_key=True),
    db.Column('object_id', db.Integer, db.ForeignKey('object.id'), primary_key=True)
)

objects_timestamps = db.Table('objects_timestamps',
    db.Column('object_id', db.Integer, db.ForeignKey('object.id'), primary_key=True),
    db.Column('timestamp_id', db.Integer, db.ForeignKey('timestamp.id'), primary_key=True)
)

class Universe(db.Model):
    ''' Basically workspace of the simulation'''
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, unique=True, nullable=False)
    objects = db.relationship('Object', secondary=universe_objects, backref='universe', lazy=True)
    def to_json(self):
        return {
            'id': self.id,
            'name': self.name,
            'objects': [o.to_json() for o in self.objects]
        }
    def to_display(self):
        return {
            'id': self.id,
            'name': self.name,
            'objects': ["object" for o in self.objects]
        }

class Object(db.Model):
    ''' Object model, so like Planet, Satellite, Rocket'''
    id = db.Column(db.Integer, primary_key=True)
    object_name = db.Column(db.String, nullable=False)
    timestamps = db.relationship('Timestamp', secondary=objects_timestamps, backref='object', lazy=True)
    mass = db.Column(db.Float, nullable=False)
    universe_id = db.Column(db.Integer, db.ForeignKey('universe.id'), nullable=False)
    def to_json(self):
        l = [t.to_json() for t in self.timestamps]
        l.sort(key=lambda x: x['time'])
        return {
            'id' : self.id,
            'object_name': self.object_name,
            'timestamps': l,
            'mass': self.mass
        }

class Timestamp(db.Model):
    """ Timestamp model, so like position, velocity, etc."""
    id = db.Column(db.Integer, primary_key=True)
    time = db.Column(db.Float, nullable=False)
    timeStep = db.Column(db.Float, nullable=False)
    x = db.Column(db.Float, nullable=False)
    y = db.Column(db.Float, nullable=False)
    vx = db.Column(db.Float, nullable=False)
    vy = db.Column(db.Float, nullable=False)
    object_id = db.Column(db.Integer, db.ForeignKey('object.id'), nullable=False)
    def to_json(self):
        return {
            'id': self.id,
            'time': self.time,
            'timeStep': self.timeStep,
            'x': self.x,
            'y': self.y,
            'vx': self.vx,
            'vy': self.vy
        }
    def to_sim_object(self):
        return {
            'time': self.time,
            'timeStep': self.timeStep,
            'x': self.x,
            'y': self.y,
            'vx': self.vx,
            'vy': self.vy
        }

