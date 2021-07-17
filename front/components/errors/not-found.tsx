export default function NotFound({ type, id }: { type: string; id: number | string }): JSX.Element {
  const message = [`The ${type}`, id !== undefined && `with ID ${id}`, `could not be found.`]
    .filter(Boolean)
    .join(' ');
  return (
    <>
      <h1>404 Not Found</h1>
      <p>{message}</p>
    </>
  );
}
