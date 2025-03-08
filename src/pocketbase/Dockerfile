FROM alpine:latest

ARG PB_VERSION=0.22.20

RUN apk add --no-cache \
    unzip \
    ca-certificates \
    # this is needed only if you want to use scp to copy later your pb_data locally
    openssh

# Copiar los archivos de PocketBase desde la carpeta pocketbase
COPY ./pocketbase /pb/

# uncomment to copy the local pb_migrations dir into the container
COPY ./pb_migrations /pb/pb_migrations

EXPOSE 8090

# start PocketBase
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090"]
