FROM python:3.9.10-alpine3.14
WORKDIR /srv
RUN pip install --upgrade pip

COPY requirements.txt /srv

RUN pip install -r requirements.txt

COPY . /srv

ENV FLASK_APP=app

CMD ["python","app.py"]