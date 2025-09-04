'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, History, Brain, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchTransactionsNaturalLanguage } from '@/features/transactions/actions';

type TTransaction = {
  id: number;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  description: string | null;
  payee: string | null;
  category: {
    name: string;
    type: string;
    color?: string;
  };
};

type TSmartSearchResult = {
  transactions: TTransaction[];
  searchSummary: {
    totalResults: number;
    interpretation: string;
    confidence: number;
    appliedFilters: string[];
    suggestions?: string[];
  };
};

type TProps = {
  onResultsFound?: (results: TSmartSearchResult) => void;
  onSearchStart?: () => void;
  onSearchComplete?: () => void;
  placeholder?: string;
  showHistory?: boolean;
  maxHistoryItems?: number;
  className?: string;
};

const EXAMPLE_QUERIES = [
  "medicine I bought 2 months ago around 20 euros",
  "grocery expenses last month under $300",
  "salary payments this year",
  "dining out expenses over $50",
  "subscriptions from last 3 months",
  "transportation costs between January and March"
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

function highlightMatchedText(text: string, searchTerms: string[]): JSX.Element {
  if (!searchTerms.length || !text) return <span>{text}</span>;
  
  const regex = new RegExp(`(${searchTerms.join('|')})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <span>
      {parts.map((part, index) => (
        searchTerms.some(term => part.toLowerCase().includes(term.toLowerCase())) ? (
          <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      ))}
    </span>
  );
}

export function NaturalLanguageSearch({
  onResultsFound,
  onSearchStart,
  onSearchComplete,
  placeholder = "Ask about your transactions...",
  showHistory = true,
  maxHistoryItems = 5,
  className
}: TProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<TSmartSearchResult | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showExamples, setShowExamples] = useState(true);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('nl-search-history');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.warn('Failed to load search history:', error);
      }
    }
  }, []);

  // Rotate through example queries
  useEffect(() => {
    if (showExamples && !query) {
      const timer = setInterval(() => {
        setCurrentExampleIndex((prev) => (prev + 1) % EXAMPLE_QUERIES.length);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [query, showExamples]);

  async function handleSearch() {
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    setShowExamples(false);
    onSearchStart?.();

    try {
      const searchResults = await searchTransactionsNaturalLanguage(query.trim());
      setResults(searchResults);
      onResultsFound?.(searchResults);

      // Update search history
      const newHistory = [
        query.trim(),
        ...searchHistory.filter(h => h !== query.trim())
      ].slice(0, maxHistoryItems);
      
      setSearchHistory(newHistory);
      localStorage.setItem('nl-search-history', JSON.stringify(newHistory));

    } catch (error) {
      console.error('Search error:', error);
      setResults({
        transactions: [],
        searchSummary: {
          totalResults: 0,
          interpretation: 'Search failed - please try again',
          confidence: 0,
          appliedFilters: [],
          suggestions: ['Check your internet connection', 'Try simplifying your query']
        }
      });
    } finally {
      setIsSearching(false);
      onSearchComplete?.();
    }
  }

  function handleHistoryItemClick(historyQuery: string) {
    setQuery(historyQuery);
    setShowExamples(false);
    // Auto-focus input for immediate editing or searching
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleExampleClick(example: string) {
    setQuery(example);
    setShowExamples(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function getConfidenceColor(confidence: number): string {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  function getConfidenceIcon(confidence: number) {
    if (confidence >= 80) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (confidence >= 60) return <Info className="w-4 h-4 text-yellow-600" />;
    return <AlertCircle className="w-4 h-4 text-red-600" />;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Input */}
      <div className="relative">
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={showExamples && !query ? EXAMPLE_QUERIES[currentExampleIndex] : placeholder}
          className="pr-12 pl-10"
          disabled={isSearching}
        />
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Button
          onClick={handleSearch}
          disabled={!query.trim() || isSearching}
          size="sm"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
        >
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Brain className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Example Queries */}
      {showExamples && !results && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-500" />
              Try asking questions like:
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUERIES.slice(0, 4).map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleExampleClick(example)}
                  className="text-xs h-8 text-left justify-start"
                >
                  "{example}"
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search History */}
      {showHistory && searchHistory.length > 0 && !results && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-gray-500" />
              Recent Searches
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {searchHistory.map((historyQuery, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleHistoryItemClick(historyQuery)}
                  className="w-full justify-start h-8 text-left font-normal"
                >
                  {historyQuery}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {results && (
        <div className="space-y-4">
          {/* Search Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                {getConfidenceIcon(results.searchSummary.confidence)}
                <div className="flex-1">
                  <p className="text-sm font-medium mb-2">
                    {results.searchSummary.interpretation}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span>Found {results.searchSummary.totalResults} results</span>
                    <span className={getConfidenceColor(results.searchSummary.confidence)}>
                      {results.searchSummary.confidence}% confidence
                    </span>
                  </div>

                  {results.searchSummary.appliedFilters.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-1">Applied filters:</p>
                      <div className="flex flex-wrap gap-1">
                        {results.searchSummary.appliedFilters.map((filter, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {filter}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.searchSummary.suggestions && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Suggestions:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {results.searchSummary.suggestions.map((suggestion, index) => (
                          <li key={index}>• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Results */}
          {results.transactions.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Matching Transactions ({results.transactions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {results.transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {highlightMatchedText(
                              transaction.description || 'No description',
                              query.split(' ').filter(word => word.length > 2)
                            )}
                          </span>
                          {transaction.payee && (
                            <span className="text-xs text-muted-foreground">
                              • {highlightMatchedText(
                                transaction.payee,
                                query.split(' ').filter(word => word.length > 2)
                              )}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{new Date(transaction.date).toLocaleDateString()}</span>
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{ color: transaction.category.color }}
                          >
                            {transaction.category.name}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "font-semibold",
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        )}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No transactions found matching your query.
                </p>
                {results.searchSummary.suggestions && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Try: {results.searchSummary.suggestions[0]}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Clear Results */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => {
                setResults(null);
                setQuery('');
                setShowExamples(true);
              }}
              className="text-sm"
            >
              New Search
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
