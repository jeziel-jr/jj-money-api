import { Prisma, PrismaClient } from '@prisma/client'
import cors from 'cors'
import express, { NextFunction, Request, Response } from 'express'
import moment from 'moment'
import { z } from 'zod'

const app = express()
app.use(express.json())
app.use(
  cors({
    origin: ['http://127.0.0.1:5173', 'https://jjmoney.vercel.app'],
    allowedHeaders: ['Content-Type'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }),
)

const prisma = new PrismaClient()

const router = express.Router()

const getTransactionsShema = z.object({
  q: z.string().optional(),
  _sort: z.enum(['description', 'price', 'createdAt']),
  _order: z.enum(['asc', 'desc']),
  month: z.string(),
  year: z.string(),
})

const queryValidate = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query)
      next()
    } catch (error) {
      return res.status(400).json(error)
    }
  }
}

router.get(
  '/transactions',
  queryValidate(getTransactionsShema),
  async (req: Request, res: Response) => {
    const { q, _sort, _order, month, year } = req.query as z.infer<
      typeof getTransactionsShema
    >
    const startDate = moment(`${year}-${month}`)
    const endDate = moment(`${year}-${month}`).endOf('month')

    const whereCondition: any = {}
    if (q) {
      whereCondition.description = {
        contains: q,
      }
    }
    const transactions = await prisma.transaction.findMany({
      where: {
        ...whereCondition,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        [_sort]: _order === 'desc' ? 'desc' : 'asc',
      },
    })
    console.log(transactions)

    res.status(200).json(transactions)
  },
)

router.post('/transactions', async (req: Request, res: Response) => {
  const { description, price, category, type, date } =
    req.body as Prisma.TransactionCreateInput
  console.log(date)

  const transaction = await prisma.transaction.create({
    data: {
      description,
      price,
      type,
      category,
      date,
    },
  })
  res.status(201).json(transaction)
})

router.delete('/transactions/:id', async (req: Request, res: Response) => {
  const id = req.params.id
  await prisma.transaction.delete({
    where: {
      id,
    },
  })
  res.status(204)
})

app.use(router)

app.listen(3000, () => {
  console.log('Server is running on port 3000')
})
