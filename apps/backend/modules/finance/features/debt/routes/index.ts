import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  DebtInsertSchema,
  DebtUpdateSchema,
  DebtFiltersSchema,
  DebtPaymentInsertSchema,
  DebtPaymentUpdateSchema,
  PaymentFiltersSchema,
  AmortizationRequestSchema,
  PaymentScheduleGenerationSchema,
  DebtConsolidationSchema,
  InterestCalculationSchema,
  BulkDebtCreateSchema,
  BulkDebtUpdateSchema,
  BulkPaymentCreateSchema
} from '../schemas';
import {
  getDebts,
  getDebtById,
  getDebtPayments,
  createDebt,
  updateDebt,
  deleteDebt,
  processPayment,
  updatePayment,
  deletePayment,
  generateAmortizationSchedule,
  calculateDebtStatistics,
  generatePaymentStrategies,
  consolidateDebts,
  calculateAccruedInterest,
  bulkCreateDebts,
  bulkUpdateDebts,
  bulkProcessPayments,
  bulkDeleteDebts
} from '../api';

const debtsRouter = new Hono();

// Debt CRUD
debtsRouter.get('/', zValidator('query', DebtFiltersSchema.optional()), async (c) => {
  const filters = c.req.valid('query') || {};
  const debts = await getDebts(filters);
  return c.json({ success: true, data: debts });
});

debtsRouter.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const debt = await getDebtById(id);
  return debt ? c.json({ success: true, data: debt }) : c.json({ success: false, error: 'Debt not found' }, 404);
});

debtsRouter.post('/', zValidator('json', DebtInsertSchema), async (c) => {
  const data = c.req.valid('json');
  const debt = await createDebt(data);
  return c.json({ success: true, data: debt }, 201);
});

debtsRouter.put('/:id', zValidator('json', DebtUpdateSchema), async (c) => {
  const id = Number(c.req.param('id'));
  const data = c.req.valid('json');
  const debt = await updateDebt({ id, ...data });
  return c.json({ success: true, data: debt });
});

debtsRouter.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const success = await deleteDebt(id);
  return c.json({ success });
});

// Debt Payments
debtsRouter.get('/payments', zValidator('query', PaymentFiltersSchema.optional()), async (c) => {
    const filters = c.req.valid('query') || {};
    const payments = await getDebtPayments(filters);
    return c.json({ success: true, data: payments });
});

debtsRouter.post('/:id/payments', zValidator('json', DebtPaymentInsertSchema), async (c) => {
  const debtId = Number(c.req.param('id'));
  const data = c.req.valid('json');
  const result = await processPayment(debtId, data);
  return c.json({ success: true, data: result });
});

debtsRouter.put('/payments/:paymentId', zValidator('json', DebtPaymentUpdateSchema), async (c) => {
  const paymentId = Number(c.req.param('paymentId'));
  const data = c.req.valid('json');
  const payment = await updatePayment({ id: paymentId, ...data });
  return c.json({ success: true, data: payment });
});

debtsRouter.delete('/payments/:paymentId', async (c) => {
  const paymentId = Number(c.req.param('paymentId'));
  const success = await deletePayment(paymentId);
  return c.json({ success });
});

// Bulk Operations
debtsRouter.post('/bulk', zValidator('json', BulkDebtCreateSchema), async (c) => {
  const { debts } = c.req.valid('json');
  const results = await bulkCreateDebts(debts);
  return c.json({ success: true, data: results }, 201);
});

debtsRouter.put('/bulk', zValidator('json', BulkDebtUpdateSchema), async (c) => {
  const { updates } = c.req.valid('json');
  const results = await bulkUpdateDebts(updates);
  return c.json({ success: true, data: results });
});

debtsRouter.post('/payments/bulk', zValidator('json', BulkPaymentCreateSchema), async (c) => {
    const { payments } = c.req.valid('json');
    const results = await bulkProcessPayments(payments);
    return c.json({ success: true, data: results });
});

debtsRouter.delete('/bulk', zValidator('json', z.object({ ids: z.array(z.number()) })), async (c) => {
    const { ids } = c.req.valid('json');
    const results = await bulkDeleteDebts(ids);
    return c.json({ success: true, data: results });
});


// Analysis
debtsRouter.get('/statistics', async (c) => {
  const stats = await calculateDebtStatistics();
  return c.json({ success: true, data: stats });
});

debtsRouter.post('/amortization', zValidator('json', AmortizationRequestSchema), async (c) => {
  const { debtId, paymentAmount, extraPayment, maxPayments } = c.req.valid('json');
  const schedule = await generateAmortizationSchedule(debtId, paymentAmount, extraPayment, maxPayments);
  return schedule ? c.json({ success: true, data: schedule }) : c.json({ success: false, error: 'Failed to generate schedule' }, 400);
});

debtsRouter.post('/strategies', zValidator('json', PaymentScheduleGenerationSchema), async (c) => {
  const { debtIds } = c.req.valid('json');
  const strategies = await generatePaymentStrategies(debtIds);
  return c.json({ success: true, data: strategies });
});

debtsRouter.post('/consolidate', zValidator('json', DebtConsolidationSchema), async (c) => {
  const { sourceDebtIds, newDebtData, consolidationDate, consolidationFees } = c.req.valid('json');
  const result = await consolidateDebts(sourceDebtIds, newDebtData, consolidationDate, consolidationFees);
  return c.json({ success: true, data: result });
});

debtsRouter.post('/calculate-interest', zValidator('json', InterestCalculationSchema), async (c) => {
  const { debtId, fromDate, toDate } = c.req.valid('json');
  const result = await calculateAccruedInterest(debtId, fromDate, toDate);
  return c.json({ success: true, data: result });
});

export { debtsRouter };
