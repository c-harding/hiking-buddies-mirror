/* eslint-disable no-console */
import { url } from '../typesafe-server/endpoint';
import { number, optional } from '../typesafe-server/parameter-universe';
import { makeDemoClient } from './make-demo-client';

const demoServer = {
  simpleEndpoint: url`/routes`
    .get()
    .withQueryParameters(optional(number('pageSize')))
    .response<200, Event[]>()
    .response<404, string>(),

  parameterizedEndpoint: url`/route/${number('id')}`
    .get()
    .response<200, Event>()
    .response<404, string>(),

  editComment: url`/event/${number('id')}/comment/${number('commentId')}`
    .put<{ commentText: string }>()
    .response<204>()
    .response<404, string>(),
};

interface Event {
  id: number;
  description: string;
}

const makeEvent = (i: number) => ({
  id: i + 1,
  description: `route number ${i + 1}`,
});

const range = (upTo: number): number[] => Array.from({ length: +upTo }, (_, i) => i);

const client = makeDemoClient(demoServer, {
  editComment: ({ id, commentId }, _, readBody) => {
    console.log(id, commentId, readBody());
    return {
      code: 204,
      body: undefined,
    };
  },

  simpleEndpoint: (_, { pageSize = 10 }) => ({
    code: 200,
    body: range(pageSize).map((i) => makeEvent(i)),
  }),
  parameterizedEndpoint: ({ id }) => ({
    code: 404,
    body: `Cannot find route with ID ${id}`,
  }),
});

client
  .simpleEndpoint({}, { pageSize: 3 })
  .then((value) => {
    console.log('simple endpoint returned', value.code, value.body);
  })
  .catch((e) => {
    console.log('could not send to simple endpoint,', e);
  });

client
  .parameterizedEndpoint({ id: 20 }, {})
  .then((value) => {
    console.log('parameterized endpoint returned', value.code, value.body);
  })
  .catch((e) => {
    console.log('could not send to parameterized endpoint,', e);
  });
