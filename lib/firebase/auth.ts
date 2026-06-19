export async function loginUser(
  _email: string,
  _password: string
): Promise<null> {
  return null;
}

export async function logoutUser(): Promise<void> {
  return;
}

export function onAuthChange(_callback: (user: null) => void): () => void {
  return () => {};
}

export function getCurrentUser(): null {
  return null;
}
