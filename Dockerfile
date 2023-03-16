FROM node:16
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

ADD ./package.json                                            /usr/src/app/package.json
ADD ./tsconfig.json                                           /usr/src/app/tsconfig.json
ADD ./tsconfig.build.json                                     /usr/src/app/tsconfig.build.json
ADD ./src                                                     /usr/src/app/src

RUN cd ~
RUN npm i --omit=dev
RUN npm run build

CMD npm run start:prod