import { eq } from 'drizzle-orm';
import { createDb } from './index';
import { 
  categoriesSchema, 
  transactionsSchema,
  TCategory,
  TTransaction
} from '../schemas';

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getRandomDateInRange(startDate: Date, endDate: Date): string {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const randomTime = start + Math.random() * (end - start);
  return formatDate(new Date(randomTime));
}

async function generateDemoCategories() {
  const db = createDb();
  
  const demoCategories = [
    { name: 'Salary', type: 'income', color: '#10B981', icon: '💰', isDemo: true },
    { name: 'Freelance', type: 'income', color: '#059669', icon: '💻', isDemo: true },
    { name: 'Investments', type: 'income', color: '#7C3AED', icon: '📈', isDemo: true },
    { name: 'Side Business', type: 'income', color: '#0891B2', icon: '🏪', isDemo: true },
    
    { name: 'Groceries', type: 'expense', color: '#F59E0B', icon: '🛒', isDemo: true },
    { name: 'Transportation', type: 'expense', color: '#EF4444', icon: '🚗', isDemo: true },
    { name: 'Utilities', type: 'expense', color: '#6366F1', icon: '⚡', isDemo: true },
    { name: 'Entertainment', type: 'expense', color: '#EC4899', icon: '🎬', isDemo: true },
    { name: 'Dining Out', type: 'expense', color: '#EA580C', icon: '🍽️', isDemo: true },
    { name: 'Healthcare', type: 'expense', color: '#DC2626', icon: '🏥', isDemo: true },
    { name: 'Education', type: 'expense', color: '#7C2D12', icon: '📚', isDemo: true },
    { name: 'Shopping', type: 'expense', color: '#BE185D', icon: '🛍️', isDemo: true },
    { name: 'Insurance', type: 'expense', color: '#1F2937', icon: '🛡️', isDemo: true },
    { name: 'Subscriptions', type: 'expense', color: '#374151', icon: '📱', isDemo: true },
    { name: 'Travel', type: 'expense', color: '#0D9488', icon: '✈️', isDemo: true },
    { name: 'Home Maintenance', type: 'expense', color: '#B45309', icon: '🏠', isDemo: true },
  ] as const;

  try {
    const insertedCategories = await db
      .insert(categoriesSchema)
      .values(demoCategories)
      .returning();
    
    console.log(`✅ Created ${insertedCategories.length} demo categories`);
    return insertedCategories;
  } catch (error) {
    console.error('❌ Error creating demo categories:', error);
    throw error;
  }
}

async function generateDemoTransactions(categories: TCategory[]) {
  const db = createDb();
  
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const salaryCategory = categories.find(c => c.name === 'Salary');
  const freelanceCategory = categories.find(c => c.name === 'Freelance');
  const investmentCategory = categories.find(c => c.name === 'Investments');
  const groceriesCategory = categories.find(c => c.name === 'Groceries');
  const transportCategory = categories.find(c => c.name === 'Transportation');
  const utilitiesCategory = categories.find(c => c.name === 'Utilities');
  const entertainmentCategory = categories.find(c => c.name === 'Entertainment');
  const diningCategory = categories.find(c => c.name === 'Dining Out');
  const healthcareCategory = categories.find(c => c.name === 'Healthcare');
  const shoppingCategory = categories.find(c => c.name === 'Shopping');
  const subscriptionCategory = categories.find(c => c.name === 'Subscriptions');
  const travelCategory = categories.find(c => c.name === 'Travel');
  
  if (!salaryCategory || !groceriesCategory) {
    throw new Error('Required demo categories not found');
  }
  
  const demoTransactions = [
    // Monthly salaries (last 3 months)
    { amount: 5500.00, type: 'income', categoryId: salaryCategory.id, date: formatDate(new Date(now.getFullYear(), now.getMonth(), 1)), note: 'Monthly salary - Current month', isDemo: true },
    { amount: 5500.00, type: 'income', categoryId: salaryCategory.id, date: formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)), note: 'Monthly salary - Last month', isDemo: true },
    { amount: 5500.00, type: 'income', categoryId: salaryCategory.id, date: formatDate(new Date(now.getFullYear(), now.getMonth() - 2, 1)), note: 'Monthly salary - Two months ago', isDemo: true },
    
    // Freelance income
    ...(freelanceCategory ? [
      { amount: 1200.00, type: 'income', categoryId: freelanceCategory.id, date: getRandomDateInRange(lastMonth, now), note: 'Web development project', isDemo: true },
      { amount: 850.00, type: 'income', categoryId: freelanceCategory.id, date: getRandomDateInRange(twoWeeksAgo, now), note: 'Logo design work', isDemo: true },
    ] : []),
    
    // Investment returns
    ...(investmentCategory ? [
      { amount: 324.50, type: 'income', categoryId: investmentCategory.id, date: getRandomDateInRange(lastMonth, now), note: 'Dividend payment - VTSAX', isDemo: true },
      { amount: 89.75, type: 'income', categoryId: investmentCategory.id, date: getRandomDateInRange(threeMonthsAgo, lastMonth), note: 'Stock sale profit', isDemo: true },
    ] : []),
    
    // Regular expenses - Groceries (weekly-ish)
    { amount: 147.82, type: 'expense', categoryId: groceriesCategory.id, date: formatDate(yesterday), note: 'Weekly grocery shopping - Whole Foods', isDemo: true },
    { amount: 89.45, type: 'expense', categoryId: groceriesCategory.id, date: formatDate(oneWeekAgo), note: 'Grocery run - Target', isDemo: true },
    { amount: 203.67, type: 'expense', categoryId: groceriesCategory.id, date: getRandomDateInRange(twoWeeksAgo, oneWeekAgo), note: 'Monthly bulk shopping - Costco', isDemo: true },
    { amount: 76.23, type: 'expense', categoryId: groceriesCategory.id, date: getRandomDateInRange(lastMonth, twoWeeksAgo), note: 'Quick grocery stop - Safeway', isDemo: true },
    
    // Transportation
    ...(transportCategory ? [
      { amount: 65.40, type: 'expense', categoryId: transportCategory.id, date: formatDate(yesterday), note: 'Gas fill-up - Shell', isDemo: true },
      { amount: 45.20, type: 'expense', categoryId: transportCategory.id, date: getRandomDateInRange(oneWeekAgo, yesterday), note: 'Gas - Chevron', isDemo: true },
      { amount: 28.50, type: 'expense', categoryId: transportCategory.id, date: getRandomDateInRange(twoWeeksAgo, oneWeekAgo), note: 'Uber to airport', isDemo: true },
      { amount: 120.00, type: 'expense', categoryId: transportCategory.id, date: getRandomDateInRange(lastMonth, twoWeeksAgo), note: 'Car maintenance - oil change', isDemo: true },
    ] : []),
    
    // Utilities (monthly)
    ...(utilitiesCategory ? [
      { amount: 89.34, type: 'expense', categoryId: utilitiesCategory.id, date: formatDate(new Date(now.getFullYear(), now.getMonth(), 15)), note: 'Electricity bill - PG&E', isDemo: true },
      { amount: 67.50, type: 'expense', categoryId: utilitiesCategory.id, date: formatDate(new Date(now.getFullYear(), now.getMonth(), 10)), note: 'Internet - Comcast', isDemo: true },
      { amount: 42.80, type: 'expense', categoryId: utilitiesCategory.id, date: formatDate(new Date(now.getFullYear(), now.getMonth(), 5)), note: 'Water bill', isDemo: true },
    ] : []),
    
    // Entertainment
    ...(entertainmentCategory ? [
      { amount: 15.99, type: 'expense', categoryId: entertainmentCategory.id, date: getRandomDateInRange(oneWeekAgo, now), note: 'Netflix subscription', isDemo: true },
      { amount: 12.99, type: 'expense', categoryId: entertainmentCategory.id, date: getRandomDateInRange(oneWeekAgo, now), note: 'Spotify Premium', isDemo: true },
      { amount: 45.00, type: 'expense', categoryId: entertainmentCategory.id, date: getRandomDateInRange(twoWeeksAgo, oneWeekAgo), note: 'Movie tickets for two', isDemo: true },
      { amount: 89.99, type: 'expense', categoryId: entertainmentCategory.id, date: getRandomDateInRange(lastMonth, twoWeeksAgo), note: 'Concert tickets', isDemo: true },
    ] : []),
    
    // Dining Out
    ...(diningCategory ? [
      { amount: 67.45, type: 'expense', categoryId: diningCategory.id, date: formatDate(yesterday), note: 'Dinner at Italian restaurant', isDemo: true },
      { amount: 23.80, type: 'expense', categoryId: diningCategory.id, date: formatDate(oneWeekAgo), note: 'Lunch - Thai food', isDemo: true },
      { amount: 18.50, type: 'expense', categoryId: diningCategory.id, date: getRandomDateInRange(twoWeeksAgo, oneWeekAgo), note: 'Coffee & pastry', isDemo: true },
      { amount: 89.30, type: 'expense', categoryId: diningCategory.id, date: getRandomDateInRange(lastMonth, twoWeeksAgo), note: 'Date night dinner', isDemo: true },
    ] : []),
    
    // Healthcare
    ...(healthcareCategory ? [
      { amount: 35.00, type: 'expense', categoryId: healthcareCategory.id, date: getRandomDateInRange(twoWeeksAgo, now), note: 'Pharmacy - prescription', isDemo: true },
      { amount: 150.00, type: 'expense', categoryId: healthcareCategory.id, date: getRandomDateInRange(lastMonth, twoWeeksAgo), note: 'Dental cleaning', isDemo: true },
      { amount: 25.00, type: 'expense', categoryId: healthcareCategory.id, date: getRandomDateInRange(threeMonthsAgo, lastMonth), note: 'Doctor copay', isDemo: true },
    ] : []),
    
    // Shopping & miscellaneous
    ...(shoppingCategory ? [
      { amount: 89.99, type: 'expense', categoryId: shoppingCategory.id, date: getRandomDateInRange(oneWeekAgo, now), note: 'New shoes - Nike', isDemo: true },
      { amount: 45.60, type: 'expense', categoryId: shoppingCategory.id, date: getRandomDateInRange(twoWeeksAgo, oneWeekAgo), note: 'Household supplies - Target', isDemo: true },
      { amount: 234.50, type: 'expense', categoryId: shoppingCategory.id, date: getRandomDateInRange(lastMonth, twoWeeksAgo), note: 'New laptop accessories', isDemo: true },
    ] : []),
    
    // Subscriptions
    ...(subscriptionCategory ? [
      { amount: 9.99, type: 'expense', categoryId: subscriptionCategory.id, date: formatDate(new Date(now.getFullYear(), now.getMonth(), 1)), note: 'Apple iCloud storage', isDemo: true },
      { amount: 19.99, type: 'expense', categoryId: subscriptionCategory.id, date: formatDate(new Date(now.getFullYear(), now.getMonth(), 3)), note: 'Adobe Creative Cloud', isDemo: true },
      { amount: 5.99, type: 'expense', categoryId: subscriptionCategory.id, date: formatDate(new Date(now.getFullYear(), now.getMonth(), 5)), note: 'Medium subscription', isDemo: true },
    ] : []),
    
    // Travel (occasional)
    ...(travelCategory ? [
      { amount: 450.00, type: 'expense', categoryId: travelCategory.id, date: getRandomDateInRange(lastMonth, now), note: 'Weekend trip - hotel', isDemo: true },
      { amount: 280.50, type: 'expense', categoryId: travelCategory.id, date: getRandomDateInRange(lastMonth, now), note: 'Flight tickets', isDemo: true },
    ] : []),
  ] as const;

  try {
    const insertedTransactions = await db
      .insert(transactionsSchema)
      .values(demoTransactions)
      .returning();
    
    console.log(`✅ Created ${insertedTransactions.length} demo transactions`);
    return insertedTransactions;
  } catch (error) {
    console.error('❌ Error creating demo transactions:', error);
    throw error;
  }
}

async function clearAllData() {
  const db = createDb();
  
  try {
    console.log('🗑️ Clearing all financial data...');
    
    const deletedTransactions = await db.delete(transactionsSchema).returning();
    console.log(`Deleted ${deletedTransactions.length} transactions`);
    
    const deletedCategories = await db.delete(categoriesSchema).returning();
    console.log(`Deleted ${deletedCategories.length} categories`);
    
    console.log('✅ All financial data cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
}

async function clearDemoData() {
  const db = createDb();
  
  try {
    console.log('🗑️ Clearing demo data...');
    
    const deletedTransactions = await db
      .delete(transactionsSchema)
      .where(eq(transactionsSchema.isDemo, true))
      .returning();
    console.log(`Deleted ${deletedTransactions.length} demo transactions`);
    
    const deletedCategories = await db
      .delete(categoriesSchema)
      .where(eq(categoriesSchema.isDemo, true))
      .returning();
    console.log(`Deleted ${deletedCategories.length} demo categories`);
    
    console.log('✅ Demo data cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing demo data:', error);
    throw error;
  }
}

async function populateDemoData() {
  console.log('🎭 Populating comprehensive demo data...');
  
  try {
    const categories = await generateDemoCategories();
    await generateDemoTransactions(categories);
    
    console.log('✅ Demo data population completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error populating demo data:', error);
    throw error;
  }
}

async function getDemoDataStats() {
  const db = createDb();
  
  try {
    const demoCategories = await db
      .select()
      .from(categoriesSchema)
      .where(eq(categoriesSchema.isDemo, true));
      
    const demoTransactions = await db
      .select()
      .from(transactionsSchema)
      .where(eq(transactionsSchema.isDemo, true));
    
    return {
      categories: demoCategories.length,
      transactions: demoTransactions.length
    };
  } catch (error) {
    console.error('❌ Error getting demo data stats:', error);
    throw error;
  }
}

export {
  generateDemoCategories,
  generateDemoTransactions,
  clearAllData,
  clearDemoData,
  populateDemoData,
  getDemoDataStats
};
