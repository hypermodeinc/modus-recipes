package main

import (
	"encoding/json"
	"fmt"

	_ "github.com/hypermodeinc/modus/sdk/go"
	"github.com/hypermodeinc/modus/sdk/go/pkg/http"
)

func GetFinancialMetrics(
	ticker string,
	reportPeriod string,
	period *string,
	limit *int,
) ([]FinancialMetrics, error) {
	if period == nil {
		defaultPeriod := "ttm"
		period = &defaultPeriod
	}
	if limit == nil {
		defaultLimit := 1
		limit = &defaultLimit
	}
	url := fmt.Sprintf("https://api.financialdatasets.ai/financial-metrics/?ticker=%s&report_period_lte=%s&limit=%d&period=%s",
		ticker, reportPeriod, *limit, *period)
	req := http.NewRequest(url, &http.RequestOptions{
		Method: "GET",
	})

	res, err := http.Fetch(req)
	if err != nil {
		return nil, err
	}

	var fmresponse FinancialMetricsAPIResponse

	err = json.Unmarshal(res.Body, &fmresponse)
	if err != nil {
		return nil, err
	}

	fmt.Println(res.Body)
	return fmresponse.FinancialMetrics, nil
}

func GetInsiderTrades(
    ticker string,
    endDate string,
    limit *int,
) ([]InsiderTrade, error) {
    if limit == nil {
        defaultLimit := 5
        limit = &defaultLimit
    }

    url := fmt.Sprintf("https://api.financialdatasets.ai/insider-trades/?ticker=%s&filing_date_lte=%s&limit=%d",
        ticker, endDate, *limit)

    req := http.NewRequest(url, &http.RequestOptions{
        Method: "GET",
    })

    res, err := http.Fetch(req)
    if err != nil {
        return nil, err
    }

    var response InsiderTradesResponse
    err = json.Unmarshal(res.Body, &response)
    if err != nil {
        return nil, err
    }

    return response.InsiderTrades, nil
}

func SearchLineItems(
    ticker []string,
    lineItems []string,
    period *string,
    limit *int,
) ([]SearchResult, error) {
    if period == nil {
        defaultPeriod := "ttm"
        period = &defaultPeriod
    }
    if limit == nil {
        defaultLimit := 1
        limit = &defaultLimit
    }

    url := "https://api.financialdatasets.ai/financials/search/line-items"
    
    body := SearchLineItemsRequest{
        Tickers:   ticker,
        LineItems: lineItems,
        Period:    *period,
        Limit:     *limit,
    }

    req := http.NewRequest(url, &http.RequestOptions{
        Method: "POST",
        Body:   body,
    })

    res, err := http.Fetch(req)
    if err != nil {
        return nil, err
    }

    var response SearchLineItemsResponse
    err = json.Unmarshal(res.Body, &response)
    if err != nil {
        return nil, err
    }

    return response.SearchResults, nil
}

func GetMarketCap(ticker string) (*CompanyFacts, error) {
    url := fmt.Sprintf("https://api.financialdatasets.ai/company/facts?ticker=%s", ticker)

    req := http.NewRequest(url, &http.RequestOptions{
        Method: "GET",
    })

    res, err := http.Fetch(req)
    if err != nil {
        return nil, err
    }

    var response CompanyFactsResponse
    err = json.Unmarshal(res.Body, &response)
    if err != nil {
        return nil, err
    }

    return &response.CompanyFacts, nil
}

func GetPrices(
    ticker string,
    startDate string,
    endDate string,
) ([]Price, error) {
    url := fmt.Sprintf("https://api.financialdatasets.ai/prices/?ticker=%s&interval=day&interval_multiplier=1&start_date=%s&end_date=%s",
        ticker, startDate, endDate)

    req := http.NewRequest(url, &http.RequestOptions{
        Method: "GET",
    })

    res, err := http.Fetch(req)
    if err != nil {
        return nil, err
    }

    var response PricesResponse
    err = json.Unmarshal(res.Body, &response)
    if err != nil {
        return nil, err
    }

    return response.Prices, nil
}
