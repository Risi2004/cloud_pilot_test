/

/

/

By using MongoDB as a vector database, you can use MongoDB Vector Search to seamlessly search and index your vector data alongside your other MongoDB data. MongoDB Vector Search enables you to query data based on its semantic meaning, combine vector search with full-text search, and filter your queries on other fields in your collection, so you can retrieve the most relevant results for your [use case.](https://www.mongodb.com/docs/atlas/atlas-vector-search/#std-label-avs-use-cases)

Use MongoDB Vector Search to power your AI applications and agentic systems by implementing [retrieval-augmented generation (RAG)](https://www.mongodb.com/docs/vector-search/tutorials/rag/#std-label-avs-rag). You can also [integrate](https://www.mongodb.com/docs/atlas/atlas-vector-search/#std-label-avs-integrations) MongoDB Vector Search with popular AI frameworks and services to quickly build AI applications and agents.

With [Automated Embedding](https://www.mongodb.com/docs/vector-search/crud-embeddings/automated-embedding/#std-label-avs-auto-embeddings), you can enable semantic search in one click. MongoDB Vector Search generates and manages vector embeddings for your text data automatically, so you don't have to write embedding code or manage model infrastructure.

[Get Started with MongoDB Vector Search](https://www.mongodb.com/docs/vector-search/tutorials/quick-start/?interface=mongosh&deployment-type=atlas&embedding=auto)

## Note

MongoDB Vector Search supports ANN search on Atlas Clusters running MongoDB v6.0.11, v7.0.2, or later and ENN search on Clusters running MongoDB v6.0.16, v7.0.10, v7.3.2, or later. You can also use MongoDB Vector Search with [self-managed](https://www.mongodb.com/docs/manual/administration/install-community/#std-label-install-mdb-community-edition) or [local Atlas deployments](https://www.mongodb.com/docs/atlas/cli/current/atlas-cli-deploy-local/) that you create with the Atlas CLI.

Vector search is a search method that returns results based on your data's semantic, or underlying, meaning. Unlike traditional full-text search which finds text matches, vector search finds [vectors](https://www.mongodb.com/docs/atlas/atlas-vector-search/#std-term-vector) that are close to your search query in multi-dimensional space. The closer the vectors are to your query, the more similar they are in meaning.

By interpreting the meaning of your search query and data, vector search allows you to consider the searcher's intent and search context to retrieve more relevant results.

For example, if you searched for the term "red fruit," full-text search returns only data that explicitly contains these keywords. However, semantic search might return data that is similar in meaning, such as fruits that are red in color like apples or strawberries.

MongoDB Vector Search supports the following vector search use cases:

*   **Semantic Search**: Query your vector embeddings based on semantic similarity by using the ANN or ENN search algorithm.

To learn more, see [How to Perform Semantic Search](https://www.mongodb.com/docs/vector-search/tutorials/quick-start/#std-label-vector-search-quick-start) and [Run Vector Search Queries.](https://www.mongodb.com/docs/vector-search/query/aggregation-stages/vector-search-stage/#std-label-return-vector-search-results)

*   **Hybrid Search**: Combine results from multiple search queries, including vector search and full-text search. To learn more, see [How to Perform Hybrid Search.](https://www.mongodb.com/docs/search/tutorial/hybrid-search/#std-label-as_hybrid-search)

*   **Generative Search**: Use MongoDB Vector Search to retrieve relevant data for your generative AI applications by implementing **retrieval-augmented generation (RAG)**.

To learn how to implement RAG, see [RAG with MongoDB Vector Search](https://www.mongodb.com/docs/vector-search/tutorials/rag/#std-label-avs-rag). To learn how to build AI agents with vector search, including implementing agentic RAG, see [Build AI Agents with MongoDB.](https://www.mongodb.com/docs/vector-search/about/ai-agents/#std-label-ai-agents)

The Automated Embedding service in MongoDB Vector Search is a one-click way to enable semantic search on the text data in your collection. With Automated Embedding, you don't need to [generate, store, or manage vector embeddings](https://www.mongodb.com/docs/vector-search/crud-embeddings/create-embeddings-manual/#std-label-create-vector-embeddings) yourself. Instead, MongoDB Vector Search Automated Embedding service generates embeddings using a Voyage AI embedding model at indexing time for the specified text field in your collection and at query time for your query text, and keeps the embeddings in sync as your data changes.

To enable Automated Embedding, you create a MongoDB Vector Search index with the `autoEmbed` type and select an embedding model. After you create the index, MongoDB Vector Search handles embedding generation, updates, and querying natively.

To learn more, see [Automated Embedding Overview.](https://www.mongodb.com/docs/vector-search/crud-embeddings/automated-embedding/#std-label-avs-auto-embeddings)

You can use MongoDB Vector Search with embedding and generative models from any AI provider. MongoDB and partners also provide specific product integrations to help you leverage MongoDB Vector Search in your AI-powered applications. These integrations include frameworks, platforms, and tools that enable you to quickly implement vector search, RAG, and AI agents.

To learn more, see [MongoDB AI Integrations.](https://www.mongodb.com/docs/atlas/ai-integrations/#std-label-vector-search-integrations)

vector
A vector is an array of numbers that represents your data in multiple dimensions. Vectors can represent any kind of data, from text, image, and audio data to unstructured data. Semantic similarity is determined by measuring the distance between vectors.

Vector dimensions refer to the number of elements in the array, and therefore the number of dimensions in vector space where the vectors are plotted.

Specifically, MongoDB Vector Search uses dense vectors, which are a type of high-dimensional vector that favors smaller storage and semantic richness. As opposed to sparse vectors, dense vectors can be packed with more data, which enables MongoDB Vector Search to capture more complex relationships.

vector embeddings
Vector embeddings are vectors you use to represent your data. These embeddings capture meaningful relationships in your data and enable tasks like semantic search and retrieval. You create vector embeddings by passing your data through an [embedding model](https://www.mongodb.com/docs/atlas/atlas-vector-search/#std-term-embedding-model), and you can store these embeddings in a MongoDB collection as a field in a document.

MongoDB Vector Search determines semantic similarity by identifying the vector embeddings that are closest in distance to your [query vector.](https://www.mongodb.com/docs/atlas/atlas-vector-search/#std-label-avs-queries)

To learn more, see [How to Create Vector Embeddings Manually.](https://www.mongodb.com/docs/vector-search/crud-embeddings/create-embeddings-manual/#std-label-create-vector-embeddings)

embedding model
Embedding models are algorithms that you use to convert your data into vector embeddings. To do this, embedding models use LLM s, machine learning models trained on a large corpus of data, to generate vector embeddings that capture the semantic meaning of your data.

The embedding model that you choose determines the dimensions of your vector embeddings. You must specify these dimensions as a field in your [MongoDB Vector Search index.](https://www.mongodb.com/docs/atlas/atlas-vector-search/#std-label-avs-indexes)

Embedding models vary depending on how the model was trained. Therefore, different models offer different advantages depending on your data and use case. To learn more, see [Choosing an Embedding Model](https://www.mongodb.com/docs/vector-search/crud-embeddings/create-embeddings-manual/#std-label-choose-embedding-model). For state-of-the-art embedding models, use [Voyage AI.](https://docs.voyageai.com/docs/introduction)

To perform vector search on your data in MongoDB, you must create a MongoDB Vector Search index. MongoDB Vector Search indexes are separate from your other database indexes and are used to efficiently retrieve documents that contain vector embeddings at query-time. In your MongoDB Vector Search index definition, you index the fields in your collection that contain your embeddings to enable vector search against those fields. MongoDB Vector Search supports embeddings that are less than and equal to 8192 dimensions in length.

You can also pre-filter your data by indexing additional fields in your collection that you want to run your MongoDB Vector Search queries against. You can filter on boolean, date, objectId, numeric, string, and UUID values, including arrays of these types. Filtering your data narrows the scope of your search and ensures that certain vector embeddings aren't considered for comparison.

To learn how to index fields for MongoDB Vector Search, see [How to Index Fields for Vector Search.](https://www.mongodb.com/docs/vector-search/index/vector-search-type/#std-label-avs-types-vector-search)

MongoDB Vector Search supports approximate nearest neighbor (ANN) search with the [Hierarchical Navigable Small Worlds](https://arxiv.org/abs/1603.09320) algorithm and exact nearest neighbor (ENN) search.

To find the most similar vectors, MongoDB Vector Search performs ANN search without scanning every vector embedding and ENN search exhaustively on all the indexed vector embeddings. To learn more, see [vectorSearch Definition.](https://www.mongodb.com/docs/vector-search/query/aggregation-stages/vector-search-stage/#std-label-vectorSearch-agg-pipeline)

MongoDB Vector Search queries consist of [aggregation pipeline stages](https://www.mongodb.com/docs/manual/aggregation/#std-label-aggregation) where the [`$vectorSearch`](https://www.mongodb.com/docs/vector-search/query/aggregation-stages/vector-search-stage/#mongodb-pipeline-pipe.-vectorSearch) stage is the first stage in the pipeline. The process for a basic MongoDB Vector Search query is as follows:

1.   You select either ANN or ENN search and specify the [query vector](https://www.mongodb.com/docs/vector-search/query/aggregation-stages/vector-search-stage/#std-label-vectorSearch-agg-pipeline-options), which is the vector embedding that represents your search query.

2.   MongoDB Vector Search finds vector embeddings in your data that are closest to the query vector.

3.   MongoDB Vector Search returns the documents that contain the most similar vectors.

To customize your vector search query, you can pre-filter your data on fields that you've indexed by using an MQL match expression with supported [query](https://www.mongodb.com/docs/manual/reference/mql/query-predicates/#std-label-query-predicates-ref) or [aggregation operators](https://www.mongodb.com/docs/manual/reference/mql/expressions/#std-label-aggregation-expressions), or you can add additional [aggregation stages](https://www.mongodb.com/docs/manual/reference/mql/aggregation-stages/#std-label-aggregation-pipeline-operator-reference) to further process and organize your results.

To learn how to create and run MongoDB Vector Search queries, see [Run Vector Search Queries.](https://www.mongodb.com/docs/vector-search/query/aggregation-stages/vector-search-stage/#std-label-return-vector-search-results)

For a hands-on experience creating MongoDB Vector Search indexes and running MongoDB Vector Search queries against sample data, try the [MongoDB Vector Search Course on MongoDB University](https://learn.mongodb.com/courses/using-vector-search-for-semantic-search) and the tutorials in the following pages:

*   [MongoDB Vector Search Quick Start](https://www.mongodb.com/docs/vector-search/tutorials/quick-start/#std-label-vector-search-quick-start)

*   [MongoDB Vector Search Use Cases and Design Patterns](https://www.mongodb.com/docs/vector-search/about/use-cases/#std-label-avs-tutorials)

For optimal performance, we recommend deploying [separate search nodes for workload isolation](https://www.mongodb.com/docs/atlas/cluster-config/multi-cloud-distribution/#std-label-configure-search-nodes). Search Nodes support concurrent query execution to improve individual query latency. To learn more, see [Review Deployment Options.](https://www.mongodb.com/docs/vector-search/deployment/deployment-options/#std-label-avs-deployment-options)