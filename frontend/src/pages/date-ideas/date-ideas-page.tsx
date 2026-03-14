import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Heart } from 'lucide-react'

export function DateIdeasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl lg:text-5xl text-ink font-light tracking-tight">
          Date Ideas
        </h1>
        <p className="font-mono text-[0.7rem] uppercase tracking-widest text-ink-muted/70 mt-2">
          Discover new ways to connect and create memories
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl font-light text-ink">
            Today's Suggestions
          </CardTitle>
          <CardDescription className="font-mono text-[0.7rem] uppercase text-ink-muted/70 tracking-tight">
            Personalized ideas based on your preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button>
              <Sparkles className="mr-2 h-4 w-4" />
              Discover New
            </Button>
            <Button variant="outline">
              <Heart className="mr-2 h-4 w-4" />
              View Favorites
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

