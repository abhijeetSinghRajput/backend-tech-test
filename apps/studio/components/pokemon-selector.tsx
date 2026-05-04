import { Box, Card, Flex, Stack, Text, TextInput, Avatar, Spinner } from "@sanity/ui";
import { useCallback, useEffect, useState, useMemo } from "react";
import { set, unset, type ObjectFieldProps } from "sanity";
import { SearchIcon } from "@sanity/icons";

interface PokemonListItem {
  name: string;
  url: string;
}

interface PokemonValue {
  name?: string;
  id?: number;
  image?: string;
}

export function PokemonSelector(props: ObjectFieldProps<PokemonValue>) {
  const { onChange, value } = props;
  const [searchQuery, setSearchQuery] = useState("");
  const [pokemonList, setPokemonList] = useState<PokemonListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial list of 500 Pokemon ONCE
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetch("https://pokeapi.co/api/v2/pokemon?limit=500")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setPokemonList(data.results);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError("Failed to fetch Pokemon list");
          setIsLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, []);

  // Filter list based on search query (client-side)
  const filteredList = useMemo(() => {
    if (!searchQuery) return [];
    return pokemonList
      .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 10); // Limit suggestions to top 10 as requested
  }, [searchQuery, pokemonList]);

  const handleSelect = useCallback(async (pokemon: PokemonListItem) => {
    setIsSelecting(true);
    setSearchQuery("");
    try {
      // Fetch detailed data ONLY once per selection
      const res = await fetch(pokemon.url);
      const data = await res.json();
      
      const newValue = {
        name: data.name,
        id: data.id,
        image: data.sprites.other["official-artwork"].front_default || data.sprites.front_default,
      };

      onChange(set(newValue));
    } catch (err) {
      console.error("Failed to fetch detailed Pokemon data", err);
    } finally {
      setIsSelecting(false);
    }
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange(unset());
  }, [onChange]);

  return (
    <Stack space={3}>
      <Box relative>
        <TextInput
          icon={SearchIcon}
          placeholder="Search for a Pokémon (e.g. Pikachu)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          disabled={isSelecting}
        />
        
        {isLoading && (
          <Box padding={2}>
            <Flex align="center" gap={2}>
              <Spinner />
              <Text size={1}>Loading Pokémon list...</Text>
            </Flex>
          </Box>
        )}

        {searchQuery && filteredList.length > 0 && (
          <Card
            border
            radius={2}
            shadow={2}
            style={{
              position: "absolute",
              zIndex: 100,
              width: "100%",
              marginTop: "4px",
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            <Stack>
              {filteredList.map((pokemon) => (
                <Box
                  as="button"
                  key={pokemon.name}
                  onClick={() => handleSelect(pokemon)}
                  padding={3}
                  style={{
                    background: "none",
                    border: "none",
                    width: "100%",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <Text weight="medium" style={{ textTransform: "capitalize" }}>
                    {pokemon.name}
                  </Text>
                </Box>
              ))}
            </Stack>
          </Card>
        )}
      </Box>

      {isSelecting && (
        <Card padding={3} tone="transparent" border radius={2}>
          <Flex align="center" gap={2}>
            <Spinner />
            <Text size={1}>Fetching details...</Text>
          </Flex>
        </Card>
      )}

      {value?.name && !isSelecting && (
        <Card padding={3} tone="primary" border radius={2}>
          <Flex align="center" gap={3}>
            {value.image && (
              <Avatar
                src={value.image}
                size={2}
                style={{ borderRadius: 0, background: "rgba(255,255,255,0.1)" }}
              />
            )}
            <Box flex={1}>
              <Text weight="bold" style={{ textTransform: "capitalize" }}>
                {value.name} (ID: {value.id})
              </Text>
            </Box>
            <Box as="button" onClick={handleClear} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <Text size={1} muted>Remove</Text>
            </Box>
          </Flex>
        </Card>
      )}

      {error && (
        <Text size={1} tone="critical">
          {error}
        </Text>
      )}
    </Stack>
  );
}
