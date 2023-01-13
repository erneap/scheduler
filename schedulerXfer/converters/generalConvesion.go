package converters

import (
	"strconv"
	"strings"
	"time"
)

func ParseUint(value string) uint {
	temp, _ := strconv.ParseUint(value, 10, 32)
	return uint(temp)
}

func ParseBoolean(value string) bool {
	return strings.EqualFold(value, "true")
}

func ParseDate(value string) time.Time {
	temp, _ := time.ParseInLocation("01-02-06", value, time.UTC)
	return temp
}

func ParseInt(value string) int {
	temp, _ := strconv.Atoi(value)
	return temp
}

func ParseFloat(value string) float64 {
	temp, _ := strconv.ParseFloat(value, 64)
	return temp
}
