package controllers

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
)

func ingestFiles(c *gin.Context) {
	form, _ := c.MultipartForm()
	files := form.File["ingest"]
	for _, file := range files {
		readerFile, _ := file.Open()
		f, err := excelize.OpenReader(readerFile)
		if err != nil {
			log.Println(err)
		}
		sheetName := f.GetSheetName(0)

		columns := make(map[string]int)

		rows, err := f.GetRows(sheetName)
		if err != nil {
			log.Println(err)
		}
		//var startDate time.Time
		//var endDate time.Time
		for i, row := range rows {
			if i == 0 {
				for j, colCell := range row {
					columns[colCell] = j
				}
			} else {

			}
		}
	}
}
