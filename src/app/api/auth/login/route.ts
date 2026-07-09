import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth/users";
import { createSession } from "@/lib/auth/session";

interface LoginBody {
  username?: string;
  password?: string;
}

export async function POST(request: Request) {
  let body: LoginBody;

  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const login = body.username?.trim() ?? "";
  const password = body.password ?? "";

  if (!login || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  try {
    const user = await authenticateUser(login, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    await createSession({
      userId: user.user_id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
    });

    return NextResponse.json({
      ok: true,
      user: {
        username: user.username,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Unable to sign in. Please try again." }, { status: 500 });
  }
}
