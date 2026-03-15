export async function PUT(req: NextRequest, context: any) {
  try {
    const session = requireApiSession(req)

    const id = context.params.id
    const body = await req.json()

    const addon = await prisma.addon.update({
      where: { id },
      data: body
    })

    return NextResponse.json(addon)

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao atualizar addon" }, { status: 500 })
  }
}