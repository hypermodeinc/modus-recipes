package main

import "encoding/json"

type FinancialMetricsAPIResponse struct {
	FinancialMetrics []FinancialMetrics `json:"financial_metrics"`
}

type FinancialMetrics struct {
    Ticker                        string  `json:"ticker"`
    MarketCap                     float64 `json:"market_cap"`
    EnterpriseValue              float64 `json:"enterprise_value"`
    PriceToEarningsRatio         float64 `json:"price_to_earnings_ratio"`
    PriceToBookRatio             float64 `json:"price_to_book_ratio"`
    PriceToSalesRatio            float64 `json:"price_to_sales_ratio"`
    EnterpriseValueToEbitdaRatio float64 `json:"enterprise_value_to_ebitda_ratio"`
    EnterpriseValueToRevenueRatio float64 `json:"enterprise_value_to_revenue_ratio"`
    GrossMargin                   float64 `json:"gross_margin"`
    OperatingMargin              float64 `json:"operating_margin"`
    NetMargin                     float64 `json:"net_margin"`
    ReturnOnEquity               float64 `json:"return_on_equity"`
    ReturnOnAssets               float64 `json:"return_on_assets"`
    ReturnOnInvestedCapital      float64 `json:"return_on_invested_capital"`
    AssetTurnover                float64 `json:"asset_turnover"`
    InventoryTurnover            float64 `json:"inventory_turnover"`
    CurrentRatio                 float64 `json:"current_ratio"`
    QuickRatio                   float64 `json:"quick_ratio"`
    CashRatio                    float64 `json:"cash_ratio"`
    DebtToEquity                 float64 `json:"debt_to_equity"`
    DebtToAssets                 float64 `json:"debt_to_assets"`
    RevenueGrowth                float64 `json:"revenue_growth"`
    EarningsGrowth               float64 `json:"earnings_growth"`
    BookValueGrowth              float64 `json:"book_value_growth"`
    PayoutRatio                  float64 `json:"payout_ratio"`
    EarningsPerShare             float64 `json:"earnings_per_share"`
    BookValuePerShare            float64 `json:"book_value_per_share"`
    FreeCashFlowPerShare         float64 `json:"free_cash_flow_per_share"`
}

// Insider Trades
type InsiderTradesResponse struct {
    InsiderTrades []InsiderTrade `json:"insider_trades"`
}

type InsiderTrade struct {
    Ticker                      string    `json:"ticker"`
    Issuer                      string    `json:"issuer"`
    Name                        string    `json:"name"`
    Title                       string    `json:"title"`
    IsBoardDirector            bool      `json:"is_board_director"`
    TransactionDate            string    `json:"transaction_date"`
    TransactionShares          float64   `json:"transaction_shares"`
    TransactionPricePerShare   float64   `json:"transaction_price_per_share"`
    TransactionValue           float64   `json:"transaction_value"`
    SharesOwnedBeforeTransaction float64 `json:"shares_owned_before_transaction"`
    SharesOwnedAfterTransaction  float64 `json:"shares_owned_after_transaction"`
    SecurityTitle              string    `json:"security_title"`
    FilingDate                 string    `json:"filing_date"`
}

// Company Facts
type CompanyFactsResponse struct {
    CompanyFacts CompanyFacts `json:"company_facts"`
}

type CompanyFacts struct {
    Ticker                string  `json:"ticker"`
    Name                 string  `json:"name"`
    CIK                  string  `json:"cik"`
    MarketCap           float64 `json:"market_cap"`
    WeightedAverageShares float64 `json:"weighted_average_shares"`
    NumberOfEmployees    float64 `json:"number_of_employees"`
    SICCode             string  `json:"sic_code"`
    SICDescription      string  `json:"sic_description"`
    WebsiteURL          string  `json:"website_url"`
    ListingDate         string  `json:"listing_date"`
    IsActive            bool    `json:"is_active"`
}

// Prices
type PricesResponse struct {
    Prices []Price `json:"prices"`
}

type Price struct {
    Open   float64 `json:"open"`
    Close  float64 `json:"close"`
    High   float64 `json:"high"`
    Low    float64 `json:"low"`
    Volume int64   `json:"volume"`
    Time   string  `json:"time"`
}

type SearchLineItemsRequest struct {
    Period    string   `json:"period"`
    Tickers   []string `json:"tickers"`
    Limit     int      `json:"limit"`
    LineItems []string `json:"line_items"`
}

type SearchLineItemsResponse struct {
    SearchResults []SearchResult `json:"search_results"`
}

type SearchResult struct {
    Ticker       string             `json:"ticker"`
    ReportPeriod string             `json:"report_period"`
    Values       map[string]float64 `json:"-"` // Will be populated from the dynamic fields
}

// UnmarshalJSON implements custom unmarshaling for SearchResult
func (sr *SearchResult) UnmarshalJSON(data []byte) error {
    // First create a map to hold all JSON data
    var rawMap map[string]interface{}
    if err := json.Unmarshal(data, &rawMap); err != nil {
        return err
    }

    // Initialize the Values map
    sr.Values = make(map[string]float64)

    // Extract known fields
    if ticker, ok := rawMap["ticker"].(string); ok {
        sr.Ticker = ticker
    }
    if period, ok := rawMap["report_period"].(string); ok {
        sr.ReportPeriod = period
    }

    // Move all numeric values to the Values map
    for key, value := range rawMap {
        if key != "ticker" && key != "report_period" {
            // Try to convert the value to float64
            switch v := value.(type) {
            case float64:
                sr.Values[key] = v
            case int:
                sr.Values[key] = float64(v)
            }
        }
    }

    return nil
}
