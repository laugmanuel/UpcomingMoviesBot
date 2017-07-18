FROM node:latest

# Create app directory
COPY ./Application/ /home/node/app/

RUN mkdir -p /home/node/app && chown -R node:node /home/node && chmod +x /home/node/app/entrypoint.sh
WORKDIR /home/node/app

USER node

ENTRYPOINT [ "./entrypoint.sh" ]
CMD [ "./entrypoint.sh" ]
