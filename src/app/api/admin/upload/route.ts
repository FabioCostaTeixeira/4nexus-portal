import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveUploadBuffer } from "@/lib/uploads";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato inválido. Use JPG, PNG, WEBP ou SVG." },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Arquivo maior que 5MB." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await saveUploadBuffer(buffer, file.name);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json(
      {
        error:
          "Falha ao gravar o arquivo. Em hospedagem serverless o disco é somente leitura — informe uma URL externa de imagem.",
      },
      { status: 500 }
    );
  }
}
