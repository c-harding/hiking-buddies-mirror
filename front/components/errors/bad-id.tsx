import { useRouter } from 'next/router';

export default function BadId(): JSX.Element {
  const router = useRouter();
  const message = `The path ${router.asPath} is not valid`;
  return (
    <>
      <h1>400 Bad request</h1>
      <p>{message}</p>
    </>
  );
}
