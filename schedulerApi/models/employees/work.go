package employees

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/json"
	"errors"
	"io"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type EmployeeLaborCode struct {
	ChargeNumber string `json:"chargeNumber"`
	Extension    string `json:"extension"`
}

type ByEmployeeLaborCode []EmployeeLaborCode

func (c ByEmployeeLaborCode) Len() int { return len(c) }
func (c ByEmployeeLaborCode) Less(i, j int) bool {
	if c[i].ChargeNumber == c[j].ChargeNumber {
		return c[i].Extension < c[j].Extension
	}
	return c[i].ChargeNumber < c[j].ChargeNumber
}
func (c ByEmployeeLaborCode) Swap(i, j int) { c[i], c[j] = c[j], c[i] }

type Work struct {
	DateWorked   time.Time `json:"dateWorked"`
	ChargeNumber string    `json:"chargeNumber"`
	Extension    string    `json:"extension"`
	PayCode      int       `json:"payCode"`
	Hours        float64   `json:"hours"`
}

type ByEmployeeWork []Work

func (c ByEmployeeWork) Len() int { return len(c) }
func (c ByEmployeeWork) Less(i, j int) bool {
	if c[i].DateWorked.Equal(c[j].DateWorked) {
		if c[i].ChargeNumber == c[j].ChargeNumber {
			return c[i].Extension < c[j].Extension
		}
		return c[i].ChargeNumber < c[j].ChargeNumber
	}
	return c[i].DateWorked.Before(c[j].DateWorked)
}
func (c ByEmployeeWork) Swap(i, j int) { c[i], c[j] = c[j], c[i] }

type EmployeeWorkRecord struct {
	EmployeeID    primitive.ObjectID `json:"employeeID" bson:"employeeID"`
	Year          uint               `json:"year" bson:"year"`
	EncryptedWork string             `json:"-" bson:"work"`
	Work          []Work             `json:"work,omitempty" bson:"-"`
}

type ByEmployeeWorkRecord []EmployeeWorkRecord

func (c ByEmployeeWorkRecord) Len() int { return len(c) }
func (c ByEmployeeWorkRecord) Less(i, j int) bool {
	if c[i].EmployeeID.Hex() == c[j].EmployeeID.Hex() {
		return c[i].Year < c[j].Year
	}
	return c[i].EmployeeID.Hex() < c[j].EmployeeID.Hex()
}
func (c ByEmployeeWorkRecord) Swap(i, j int) { c[i], c[j] = c[j], c[i] }

func (e *EmployeeWorkRecord) Encrypt() error {
	// remove work data before encryption
	data, err := json.Marshal(e.Work)
	if err != nil {
		return err
	}

	// get the security key from the environment and create a byte array from
	// it for the cipher
	keyString := os.Getenv("SECURITY_KEY")
	key := []byte(keyString)

	// create the aes cipher using our security key
	c, err := aes.NewCipher(key)
	if err != nil {
		return err
	}

	// create the GCM for the symetric key
	gcm, err := cipher.NewGCM(c)
	if err != nil {
		return err
	}

	// create a new byte array to hold the nonce which must be passed to create
	// the encrypted value.
	nonce := make([]byte, gcm.NonceSize())
	// and populate it with a random code
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return err
	}

	// lastly, encrypt the value and store in problem property above
	e.EncryptedWork = string(gcm.Seal(nonce, nonce, data, nil))

	return nil
}

func (e *EmployeeWorkRecord) Decrypt() error {
	prob := []byte(e.EncryptedWork)
	if len(prob) == 0 {
		return errors.New("no encrypted work data")
	}
	// get the security key from the environment and create a byte array from
	// it for the cipher
	keyString := os.Getenv("SECURITY_KEY")
	key := []byte(keyString)

	// create the aes cipher using our security key
	c, err := aes.NewCipher(key)
	if err != nil {
		return err
	}

	// create the GCM for the symetric key
	gcm, err := cipher.NewGCM(c)
	if err != nil {
		return err
	}

	nonceSize := gcm.NonceSize()
	if len(prob) < nonceSize {
		return errors.New("encrypted data too small")
	}

	nonce, prob := prob[:nonceSize], prob[nonceSize:]
	plainText, err := gcm.Open(nil, nonce, prob, nil)
	if err != nil {
		return err
	}
	json.Unmarshal(plainText, &e.Work)
	return nil
}
