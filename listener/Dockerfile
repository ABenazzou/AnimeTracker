FROM python:3.9
WORKDIR /listener/src
COPY requirements.txt /requirements.txt
RUN pip install -r /requirements.txt
COPY src .
CMD ["python", "/listener/src/main.py"]