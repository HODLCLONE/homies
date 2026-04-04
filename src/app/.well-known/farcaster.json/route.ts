import { NextResponse } from "next/server";

const appUrl = "https://stmbl.hodlhq.app";
const miniappImageUrl = `${appUrl}/miniapp-image`;

function getAccountAssociation() {
  const header = process.env.FARCASTER_HEADER?.trim();
  const payload = process.env.FARCASTER_PAYLOAD?.trim();
  const signature = process.env.FARCASTER_SIGNATURE?.trim();

  if (!header || !payload || !signature) return undefined;
  return { header, payload, signature };
}

export async function GET() {
  const accountAssociation = getAccountAssociation();

  return NextResponse.json({
    accountAssociation,
    frame: {
      version: "1",
      name: "STMBL",
      homeUrl: appUrl,
      iconUrl: miniappImageUrl,
      imageUrl: miniappImageUrl,
      buttonTitle: "STUMBLE",
      splashImageUrl: miniappImageUrl,
      splashBackgroundColor: "#061018",
    },
  });
}
