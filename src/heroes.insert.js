const uuid = require('uuid')

class Handler {
  constructor ({ dynamoDBSvc }) {
    this.dynamoDBSvc = dynamoDBSvc
    this.dynamoDbTable = process.env.DYNAMODB_TABLE
  }

  prepareData(data){ 
    const params = {
      TableName: this.dynamoDbTable,
      Item: {
        ...data,
        id: uuid.v1(),
        created_at: new Date().toISOString()
      }
    }

    return params;
  }

  async insertItem(params) {
    return this.dynamoDBSvc.put(params).promise()
  }

  handlerSuccess(data) {
    const response = {
      statusCode: 200, 
      body: JSON.stringify(data)
    }

    return response;
  }

  handlerError(data) {
    return {
      statusCode: data.statusCode || 501,
      headers: { 'Content-Type': 'text/plain '},
      body: `Couldn\'t create item.`
    }
  }

  async main(event) {
    try {
      const data = JSON.parse(event.body)

      const dbParams = this.prepareData(data)
      await this.insertItem(dbParams)

      return this.handlerSuccess(dbParams.Item)
    } catch (error) {
      return this.handlerError({ statusCode: 500 })
    }
  }
}

const AWS = require('aws-sdk')
const dynamoDB = new AWS.DynamoDB.DocumentClient()

const handler = new Handler({
  dynamoDBSvc: dynamoDB,
})

module.exports = handler.main.bind(handler)