FROM python:3.10

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1


RUN mkdir /home/app
# Set work dir
WORKDIR /home/app

COPY . .

RUN pip3 install --no-cache-dir -r requirements.txt

RUN python3 manage.py collectstatic --noinput

RUN chmod -R 755 /home/app/media/

EXPOSE 8000
 
# start server
CMD [ "/usr/local/bin/gunicorn", "--chdir", "/home/app","boomerangue.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "9" ]