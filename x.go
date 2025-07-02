package main

import (
	"fmt"
	"sync"
	"time"
)

func Chumma() {
	var count int
	var mu sync.Mutex

	for i := 0; i < 1000; i++ {
		go func() {
			mu.Lock()
			defer mu.Unlock()
			fmt.Println(count)
			count++
		}()
	}

	time.Sleep(1)
	fmt.Print(count)
}
